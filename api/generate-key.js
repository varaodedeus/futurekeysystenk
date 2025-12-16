import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 4);

function generateKey() {
  return `AGRD-${nanoid()}-${nanoid()}-${nanoid()}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let client;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'Não autorizado' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { projectId, duration, note } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'ID do projeto é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    // Verificar se projeto pertence ao usuário
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(decoded.userId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    // Gerar key única
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
      userId: new ObjectId(decoded.userId),
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

    // Atualizar stats do projeto
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
}
