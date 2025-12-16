import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

    // Log de tentativa
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

    // Verificar se key está banida
    if (keyDoc.status === 'banned') {
      logEntry.action = 'banned';
      logEntry.reason = 'Key banida';
      await db.collection('logs').insertOne(logEntry);
      return res.status(403).json({ success: false, error: 'Key foi banida' });
    }

    // Verificar expiração
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

    // Verificar HWID
    if (keyDoc.hwid === null) {
      // Primeira validação - registrar HWID
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
      // HWID não corresponde
      logEntry.action = 'hwid_mismatch';
      logEntry.reason = `HWID esperado: ${keyDoc.hwid}, recebido: ${hwid}`;
      await db.collection('logs').insertOne(logEntry);
      return res.status(403).json({ success: false, error: 'HWID não corresponde' });
    } else {
      // HWID correto - atualizar lastUsed
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

    // Atualizar stats do projeto
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
}
