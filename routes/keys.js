import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';

const router = express.Router();
const uri = 'mongodb+srv://authguard:slazin123@cluster0.sxwnhrt.mongodb.net/baodms?retryWrites=true&w=majority';
const JWT_SECRET = 'authguard_jwt_secret_2024_super_seguro_X9kP2mZq';
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 4);

function generateKey() {
  return `AGRD-${nanoid()}-${nanoid()}-${nanoid()}`;
}

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

// Gerar key
router.post('/generate-key', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId, duration, note } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'ID do projeto é obrigatório' });
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

    let key;
    let exists = true;
    while (exists) {
      key = generateKey();
      const check = await db.collection('keys').findOne({ key });
      if (!check) exists = false;
    }

    const durationDays = parseInt(duration) || 0;
    // Não define expiresAt até primeira validação
    const result = await db.collection('keys').insertOne({
      projectId: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId),
      key,
      hwid: null,
      duration: durationDays,
      status: 'pending', // pending até primeira validação
      createdAt: new Date(),
      expiresAt: null, // só seta na primeira validação
      firstUsedAt: null,
      lastUsed: null,
      usageCount: 0,
      note: note || ''
    });

    await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $inc: { 'stats.totalKeys': 1 } } // Só incrementa activeKeys na primeira validação
    );

    res.status(201).json({
      success: true,
      key: {
        id: result.insertedId,
        key,
        duration: durationDays,
        expiresAt,
        note,
        status: 'active',
        hwid: null,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Generate key error:', error);
    res.status(500).json({ success: false, error: 'Erro ao gerar key' });
  } finally {
    if (client) await client.close();
  }
});

// Listar keys
router.get('/list-keys', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'ID do projeto é obrigatório' });
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

    const now = new Date();
    for (const key of keys) {
      if (key.expiresAt && key.expiresAt < now && key.status === 'active') {
        await db.collection('keys').updateOne(
          { _id: key._id },
          { $set: { status: 'expired' } }
        );
        key.status = 'expired';
      }
    }

    res.status(200).json({ success: true, keys });
  } catch (error) {
    console.error('List keys error:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar keys' });
  } finally {
    if (client) await client.close();
  }
});

// Validar key (PÚBLICO)
router.post('/validate-key', async (req, res) => {
  let client;
  try {
    const { key, hwid, projectId } = req.body;

    if (!key || !hwid || !projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Key, HWID e projectId são obrigatórios' 
      });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const keyDoc = await db.collection('keys').findOne({ 
      key,
      projectId: new ObjectId(projectId)
    });

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    const logEntry = {
      projectId: new ObjectId(projectId),
      keyId: keyDoc?._id || null,
      key,
      hwid,
      ip,
      timestamp: new Date()
    };

    // Checar se key existe
    if (!keyDoc) {
      logEntry.action = 'failed';
      logEntry.reason = 'Key não encontrada';
      await db.collection('logs').insertOne(logEntry);
      return res.status(404).json({ success: false, error: 'Key não encontrada' });
    }

    // Checar se foi banida
    if (keyDoc.status === 'banned') {
      logEntry.action = 'banned';
      logEntry.reason = 'Key banida';
      await db.collection('logs').insertOne(logEntry);
      return res.status(403).json({ success: false, error: 'Key foi banida' });
    }

    // Checar expiração (se já foi ativada)
    if (keyDoc.expiresAt && new Date() > new Date(keyDoc.expiresAt)) {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { $set: { status: 'expired' } }
      );
      logEntry.action = 'expired';
      logEntry.reason = 'Key expirou';
      await db.collection('logs').insertOne(logEntry);
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
      
      logEntry.action = 'validated';
      logEntry.reason = 'HWID registrado e período iniciado';
      
      // Incrementar activeKeys na primeira validação
      await db.collection('projects').updateOne(
        { _id: new ObjectId(projectId) },
        { $inc: { 'stats.activeKeys': 1 } }
      );
      
    // HWID não corresponde
    } else if (keyDoc.hwid !== hwid) {
      logEntry.action = 'hwid_mismatch';
      logEntry.reason = `HWID esperado: ${keyDoc.hwid}, recebido: ${hwid}`;
      await db.collection('logs').insertOne(logEntry);
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
      logEntry.action = 'validated';
      logEntry.reason = 'Sucesso';
    }

    await db.collection('logs').insertOne(logEntry);
    await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $inc: { 'stats.totalValidations': 1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Key válida',
      expiresAt: keyDoc.expiresAt,
      duration: keyDoc.duration
    });
  } catch (error) {
    console.error('Validate key error:', error);
    res.status(500).json({ success: false, error: 'Erro ao validar key' });
  } finally {
    if (client) await client.close();
  }
});

// Reset HWID
router.post('/reset-hwid', authMiddleware, async (req, res) => {
  let client;
  try {
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json({ success: false, error: 'ID da key é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const key = await db.collection('keys').findOne({
      _id: new ObjectId(keyId),
      userId: new ObjectId(req.user.userId)
    });

    if (!key) {
      return res.status(404).json({ success: false, error: 'Key não encontrada' });
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

// Deletar key
router.delete('/delete-key', authMiddleware, async (req, res) => {
  let client;
  try {
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json({ success: false, error: 'ID da key é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const key = await db.collection('keys').findOne({
      _id: new ObjectId(keyId),
      userId: new ObjectId(req.user.userId)
    });

    if (!key) {
      return res.status(404).json({ success: false, error: 'Key não encontrada' });
    }

    await db.collection('keys').deleteOne({ _id: new ObjectId(keyId) });

    const updateStats = { $inc: { 'stats.totalKeys': -1 } };
    if (key.status === 'active') {
      updateStats.$inc['stats.activeKeys'] = -1;
    }
    await db.collection('projects').updateOne({ _id: key.projectId }, updateStats);

    res.status(200).json({ success: true, message: 'Key deletada com sucesso' });
  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar key' });
  } finally {
    if (client) await client.close();
  }
});

export default router;

// VALIDAR KEY SIMPLES (sem script - usuário traz próprio script)
router.post('/validate-key-simple', async (req, res) => {
  let client;
  try {
    const { key, hwid } = req.body;

    if (!key || !hwid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Key e HWID são obrigatórios' 
      });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    // Busca a key
    const keyDoc = await db.collection('keys').findOne({ key });

    if (!keyDoc) {
      return res.status(404).json({ success: false, error: 'Key não encontrada' });
    }

    // Verifica se key foi banida
    if (keyDoc.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Key foi banida' });
    }

    // Verifica expiração
    if (keyDoc.expiresAt && new Date() > new Date(keyDoc.expiresAt)) {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { $set: { status: 'expired' } }
      );
      return res.status(403).json({ success: false, error: 'Key expirou' });
    }

    // PRIMEIRA VALIDAÇÃO (registrar HWID)
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
      
      // Incrementar stats
      await db.collection('projects').updateOne(
        { _id: keyDoc.projectId },
        { 
          $inc: { 
            'stats.activeKeys': 1,
            'stats.totalValidations': 1
          }
        }
      );
      
    // HWID não corresponde
    } else if (keyDoc.hwid !== hwid) {
      return res.status(403).json({ success: false, error: 'HWID não corresponde' });
      
    // Validação normal
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

    // RETORNA SUCESSO (usuário executa próprio script)
    res.status(200).json({
      success: true,
      message: 'Key válida!',
      expiresAt: keyDoc.expiresAt,
      duration: keyDoc.duration
    });

  } catch (error) {
    console.error('Validate key simple error:', error);
    res.status(500).json({ success: false, error: 'Erro ao validar key' });
  } finally {
    if (client) await client.close();
  }
});
