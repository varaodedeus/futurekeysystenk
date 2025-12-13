import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';

const router = express.Router();
const uri = 'mongodb+srv://authguard:slazin123@cluster0.sxwnhrt.mongodb.net/baodms?retryWrites=true&w=majority';
const JWT_SECRET = 'authguard_jwt_secret_2024_super_seguro_X9kP2mZq';
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Não autorizado' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
}

// UPLOAD DE SCRIPT (Admin sobe o script obfuscado)
router.post('/upload-script', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId, scriptContent, scriptName } = req.body;

    if (!projectId || !scriptContent) {
      return res.status(400).json({ success: false, error: 'ProjectId e scriptContent são obrigatórios' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    // Verifica se projeto existe e pertence ao usuário
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    // Gera ID único para o script
    let scriptId;
    let exists = true;
    while (exists) {
      scriptId = nanoid();
      const check = await db.collection('scripts').findOne({ scriptId });
      if (!check) exists = false;
    }

    // Salva script no banco
    await db.collection('scripts').insertOne({
      scriptId,
      projectId: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId),
      scriptName: scriptName || 'Script sem nome',
      scriptContent, // Script OBFUSCADO
      uploadedAt: new Date(),
      executions: 0
    });

    res.status(201).json({
      success: true,
      scriptId,
      message: 'Script enviado com sucesso!'
    });

  } catch (error) {
    console.error('Upload script error:', error);
    res.status(500).json({ success: false, error: 'Erro ao fazer upload' });
  } finally {
    if (client) await client.close();
  }
});

// LISTAR SCRIPTS DO PROJETO
router.get('/list-scripts', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'ProjectId é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const scripts = await db.collection('scripts')
      .find({ 
        projectId: new ObjectId(projectId),
        userId: new ObjectId(req.user.userId)
      })
      .sort({ uploadedAt: -1 })
      .toArray();

    res.status(200).json({ success: true, scripts });

  } catch (error) {
    console.error('List scripts error:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar scripts' });
  } finally {
    if (client) await client.close();
  }
});

// DELETAR SCRIPT
router.delete('/delete-script', authMiddleware, async (req, res) => {
  let client;
  try {
    const { scriptId } = req.body;

    if (!scriptId) {
      return res.status(400).json({ success: false, error: 'ScriptId é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const script = await db.collection('scripts').findOne({
      scriptId,
      userId: new ObjectId(req.user.userId)
    });

    if (!script) {
      return res.status(404).json({ success: false, error: 'Script não encontrado' });
    }

    await db.collection('scripts').deleteOne({ scriptId });

    res.status(200).json({ success: true, message: 'Script deletado com sucesso' });

  } catch (error) {
    console.error('Delete script error:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar script' });
  } finally {
    if (client) await client.close();
  }
});

// EXECUTAR SCRIPT (PÚBLICO - validação de key)
router.post('/execute-script', async (req, res) => {
  let client;
  try {
    const { scriptId, key, hwid } = req.body;

    if (!scriptId || !key || !hwid) {
      return res.status(400).json({ 
        success: false, 
        error: 'ScriptId, key e HWID são obrigatórios' 
      });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    // Busca o script
    const script = await db.collection('scripts').findOne({ scriptId });

    if (!script) {
      return res.status(404).json({ success: false, error: 'Script não encontrado' });
    }

    // Busca a key
    const keyDoc = await db.collection('keys').findOne({ 
      key,
      projectId: script.projectId
    });

    if (!keyDoc) {
      return res.status(404).json({ success: false, error: 'Key não encontrada' });
    }

    // Verifica se key foi banida
    if (keyDoc.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Key foi banida' });
    }

    // Verifica expiração (se já foi ativada)
    if (keyDoc.expiresAt && new Date() > new Date(keyDoc.expiresAt)) {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { $set: { status: 'expired' } }
      );
      return res.status(403).json({ success: false, error: 'Key expirou' });
    }

    // PRIMEIRA VALIDAÇÃO (registrar HWID e iniciar período)
    if (keyDoc.hwid === null) {
      const now = new Date();
      const expiresAt = keyDoc.duration === 0 ? null : new Date(now.getTime() + keyDoc.duration * 24 * 60 * 60 * 1000);
      
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { 
          $set: { 
            hwid, 
            status: 'active',
            firstUsedAt: now,
            lastUsed: now,
            expiresAt: expiresAt
          },
          $inc: { usageCount: 1 }
        }
      );
      
      // Incrementar activeKeys
      await db.collection('projects').updateOne(
        { _id: script.projectId },
        { $inc: { 'stats.activeKeys': 1 } }
      );
      
    // HWID não corresponde
    } else if (keyDoc.hwid !== hwid) {
      return res.status(403).json({ success: false, error: 'HWID não corresponde' });
      
    // Validação normal (já tem HWID)
    } else {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { 
          $set: { lastUsed: new Date() },
          $inc: { usageCount: 1 }
        }
      );
    }

    // Incrementa execuções do script
    await db.collection('scripts').updateOne(
      { scriptId },
      { $inc: { executions: 1 } }
    );

    // RETORNA O SCRIPT (conteúdo obfuscado)
    res.status(200).json({
      success: true,
      script: script.scriptContent,
      expiresAt: keyDoc.expiresAt,
      duration: keyDoc.duration
    });

  } catch (error) {
    console.error('Execute script error:', error);
    res.status(500).json({ success: false, error: 'Erro ao executar script' });
  } finally {
    if (client) await client.close();
  }
});

export default router;
