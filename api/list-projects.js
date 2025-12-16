import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let client;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'Não autorizado' });

    const decoded = jwt.verify(token, JWT_SECRET);

    client = await MongoClient.connect(uri);
    const db = client.db();

    const projects = await db.collection('projects')
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar projetos' });
  } finally {
    if (client) await client.close();
  }
}
