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

    // Gerar ID numérico incremental
    const counter = await db.collection('counters').findOneAndUpdate(
      { _id: 'projectId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    
    const numericId = counter.seq || 1000;

    const result = await db.collection('projects').insertOne({
      userId: new ObjectId(req.user.userId),
      numericId: numericId,
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

// DELETAR PROJETO
router.delete('/delete-project', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'ProjectId é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    // Verifica se projeto existe e pertence ao usuário
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    // Deleta todas as keys do projeto
    await db.collection('keys').deleteMany({ projectId: new ObjectId(projectId) });

    // Deleta todos os scripts do projeto
    await db.collection('scripts').deleteMany({ projectId: new ObjectId(projectId) });

    // Deleta o projeto
    await db.collection('projects').deleteOne({ _id: new ObjectId(projectId) });

    res.status(200).json({ 
      success: true, 
      message: 'Projeto deletado com sucesso (incluindo keys e scripts)' 
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar projeto' });
  } finally {
    if (client) await client.close();
  }
});

// ANALYTICS - Últimos 7 dias
router.get('/analytics/:projectId', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId } = req.params;

    client = await MongoClient.connect(uri);
    const db = client.db();

    // Verifica se projeto pertence ao usuário
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    // Últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Keys criadas nos últimos 7 dias
    const keysCreated = await db.collection('keys')
      .find({ 
        projectId: new ObjectId(projectId),
        createdAt: { $gte: sevenDaysAgo }
      })
      .toArray();

    // Agrupa por dia
    const dailyStats = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      dailyStats[dateStr] = {
        keysCreated: 0,
        keysActivated: 0,
        executions: 0
      };
    }

    // Conta keys criadas
    keysCreated.forEach(key => {
      const dateStr = new Date(key.createdAt).toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].keysCreated++;
        if (key.status === 'active') {
          dailyStats[dateStr].keysActivated++;
        }
      }
    });

    // TODO: Adicionar tracking de execuções
    // Por enquanto, execuções ficam zeradas

    res.status(200).json({
      success: true,
      analytics: dailyStats
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar analytics' });
  } finally {
    if (client) await client.close();
  }
});
