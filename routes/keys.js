import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';

const router = express.Router();
const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
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
    const expiresAt = durationDays === 0 ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const result = await db.collection('keys').insertOne({
      projectId: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId),
      key,
      hwid: null,
      duration: durationDays,
      status: 'active',
      createdAt: new Date(),
      expiresAt,
      lastUsed: null,
      usageCount: 0,
      note: note || ''
    });

    await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $inc: { 'stats.totalKeys': 1, 'stats.activeKeys': 1 } }
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

    if (!keyDoc) {
      logEntry.action = 'failed';
      logEntry.reason = 'Key não encontrada';
      await db.collection('logs').insertOne(logEntry);
      return res.status(404).json({ success: false, error: 'Key não encontrada' });
    }

    if (keyDoc.status === 'banned') {
      logEntry.action = 'banned';
      logEntry.reason = 'Key banida';
      await db.collection('logs').insertOne(logEntry);
      return res.status(403).json({ success: false, error: 'Key foi banida' });
    }

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

    if (keyDoc.hwid === null) {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { 
          $set: { hwid, lastUsed: new Date() },
          $inc: { usageCount: 1 }
        }
      );
      logEntry.action = 'validated';
      logEntry.reason = 'HWID registrado';
    } else if (keyDoc.hwid !== hwid) {
      logEntry.action = 'hwid_mismatch';
      logEntry.reason = `HWID esperado: ${keyDoc.hwid}, recebido: ${hwid}`;
      await db.collection('logs').insertOne(logEntry);
      return res.status(403).json({ success: false, error: 'HWID não corresponde' });
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
