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
    const { projectId } = req.query;

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

    const keys = await db.collection('keys')
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Atualizar status de keys expiradas
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
}
