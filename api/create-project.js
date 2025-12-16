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
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Nome do projeto é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const result = await db.collection('projects').insertOne({
      userId: new ObjectId(decoded.userId),
      name,
      description: description || '',
      createdAt: new Date(),
      stats: {
        totalKeys: 0,
        activeKeys: 0,
        totalValidations: 0
      }
    });

    res.status(201).json({
      success: true,
      project: {
        id: result.insertedId,
        name,
        description,
        stats: { totalKeys: 0, activeKeys: 0, totalValidations: 0 }
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar projeto' });
  } finally {
    if (client) await client.close();
  }
}
