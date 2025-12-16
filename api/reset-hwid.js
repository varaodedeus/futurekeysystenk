import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

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
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json({ success: false, error: 'ID da key é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const key = await db.collection('keys').findOne({
      _id: new ObjectId(keyId),
      userId: new ObjectId(decoded.userId)
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
}
