import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const router = express.Router();
const uri = 'mongodb+srv://authguard:slazin123@cluster0.sxwnhrt.mongodb.net/baodms?retryWrites=true&w=majority';
const JWT_SECRET = 'authguard_jwt_secret_2024_super_seguro_X9kP2mZq';

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

// Criar projeto
router.post('/create-project', authMiddleware, async (req, res) => {
  let client;
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Nome do projeto é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const result = await db.collection('projects').insertOne({
      userId: new ObjectId(req.user.userId),
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
});

// Listar projetos
router.get('/list-projects', authMiddleware, async (req, res) => {
  let client;
  try {
    client = await MongoClient.connect(uri);
    const db = client.db();

    const projects = await db.collection('projects')
      .find({ userId: new ObjectId(req.user.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar projetos' });
  } finally {
    if (client) await client.close();
  }
});

export default router;
