import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';

const router = express.Router();

const uri = 'mongodb+srv://script:vPKglLq6l3dglecM@cluster0.xwvbw.mongodb.net/authguard?retryWrites=true&w=majority';

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Token não fornecido' });
  
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, 'seu_secret_jwt_aqui');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
};

// GERAR KEY
router.post('/generate-key', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId, duration, note } = req.body;

    if (!projectId || duration === undefined) {
      return res.status(400).json({ success: false, error: 'ProjectId e duration são obrigatórios' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    const key = `AGRD-${nanoid(4)}-${nanoid(4)}-${nanoid(4)}`.toUpperCase();

    const keyDoc = {
      key,
      projectId: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId),
      duration: parseInt(duration),
      status: 'pending',
      hwid: null,
      createdAt: new Date(),
      firstUsedAt: null,
      lastUsed: null,
      expiresAt: null,
      usageCount: 0,
      note: note || null
    };

    await db.collection('keys').insertOne(keyDoc);

    await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $inc: { 'stats.totalKeys': 1 } }
    );

    res.status(201).json({ success: true, key, keyId: keyDoc._id });

  } catch (error) {
    console.error('Generate key error:', error);
    res.status(500).json({ success: false, error: 'Erro ao gerar key' });
  } finally {
    if (client) await client.close();
  }
});

// LISTAR KEYS
router.get('/list-keys', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'ProjectId é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    const keys = await db.collection('keys')
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, keys });

  } catch (error) {
    console.error('List keys error:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar keys' });
  } finally {
    if (client) await client.close();
  }
});

// DELETAR KEY
router.delete('/delete-key', authMiddleware, async (req, res) => {
  let client;
  try {
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json({ success: false, error: 'KeyId é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const keyDoc = await db.collection('keys').findOne({ _id: new ObjectId(keyId) });

    if (!keyDoc) {
      return res.status(404).json({ success: false, error: 'Key não encontrada' });
    }

    const project = await db.collection('projects').findOne({
      _id: keyDoc.projectId,
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(403).json({ success: false, error: 'Não autorizado' });
    }

    await db.collection('keys').deleteOne({ _id: new ObjectId(keyId) });

    await db.collection('projects').updateOne(
      { _id: keyDoc.projectId },
      { $inc: { 'stats.totalKeys': -1 } }
    );

    if (keyDoc.status === 'active') {
      await db.collection('projects').updateOne(
        { _id: keyDoc.projectId },
        { $inc: { 'stats.activeKeys': -1 } }
      );
    }

    res.status(200).json({ success: true, message: 'Key deletada com sucesso' });

  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar key' });
  } finally {
    if (client) await client.close();
  }
});

// RESETAR HWID
router.post('/reset-hwid', authMiddleware, async (req, res) => {
  let client;
  try {
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json({ success: false, error: 'KeyId é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const keyDoc = await db.collection('keys').findOne({ _id: new ObjectId(keyId) });

    if (!keyDoc) {
      return res.status(404).json({ success: false, error: 'Key não encontrada' });
    }

    const project = await db.collection('projects').findOne({
      _id: keyDoc.projectId,
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(403).json({ success: false, error: 'Não autorizado' });
    }

    await db.collection('keys').updateOne(
      { _id: new ObjectId(keyId) },
      { $set: { hwid: null } }
    );

    res.status(200).json({ success: true, message: 'HWID resetado com sucesso' });

  } catch (error) {
    console.error('Reset HWID error:', error);
    res.status(500).json({ success: false, error: 'Erro ao resetar HWID' });
  } finally {
    if (client) await client.close();
  }
});

// VALIDAR KEY - Simples e direto
router.post('/validate-key', async (req, res) => {
  let client;
  try {
    const { key, hwid, projectId } = req.body;

    if (!key || !hwid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Key e HWID obrigatórios' 
      });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    // Busca a key
    const keyDoc = await db.collection('keys').findOne({ key });

    if (!keyDoc) {
      return res.status(404).json({ success: false, error: 'Key inválida' });
    }

    // Verifica projeto (se enviado)
    if (projectId && keyDoc.projectId.toString() !== projectId) {
      return res.status(403).json({ success: false, error: 'Key não pertence a este projeto' });
    }

    // Verifica status
    if (keyDoc.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Key banida' });
    }

    // Verifica expiração
    if (keyDoc.expiresAt && new Date() > new Date(keyDoc.expiresAt)) {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { $set: { status: 'expired' } }
      );
      return res.status(403).json({ success: false, error: 'Key expirada' });
    }

    // PRIMEIRA VEZ? Registra HWID
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
      
      await db.collection('projects').updateOne(
        { _id: keyDoc.projectId },
        { 
          $inc: { 
            'stats.activeKeys': 1,
            'stats.totalValidations': 1
          }
        }
      );
      
    // HWID diferente? ERRO
    } else if (keyDoc.hwid !== hwid) {
      return res.status(403).json({ success: false, error: 'HWID não corresponde' });
      
    // OK! Atualiza uso
    } else {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { 
          $set: { lastUsed: new Date() },
          $inc: { usageCount: 1 }
        }
      );
      
      await db.collection('projects').updateOne(
        { _id: keyDoc.projectId },
        { $inc: { 'stats.totalValidations': 1 } }
      );
    }

    // SUCESSO!
    res.status(200).json({
      success: true,
      message: 'Key válida!'
    });

  } catch (error) {
    console.error('Validate key error:', error);
    res.status(500).json({ success: false, error: 'Erro no servidor' });
  } finally {
    if (client) await client.close();
  }
});

export default router;
