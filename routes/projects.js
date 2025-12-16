import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const router = express.Router();

const uri = 'mongodb+srv://authguard:slazin123@cluster0.sxwnhrt.mongodb.net/baodms?retryWrites=true&w=majority';
const JWT_SECRET = 'authguard_jwt_secret_2024_super_seguro_X9kP2mZq';

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Token não fornecido' });
  
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
};

// CRIAR PROJETO
router.post('/create-project', authMiddleware, async (req, res) => {
  let client;
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    const projectDoc = {
      name,
      description: description || '',
      userId: new ObjectId(req.user.userId),
      createdAt: new Date(),
      stats: {
        totalKeys: 0,
        activeKeys: 0,
        totalValidations: 0
      }
    };

    const result = await db.collection('projects').insertOne(projectDoc);

    res.status(201).json({ 
      success: true, 
      projectId: result.insertedId,
      project: projectDoc
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar projeto' });
  } finally {
    if (client) await client.close();
  }
});

// LISTAR PROJETOS
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

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    await db.collection('keys').deleteMany({ projectId: new ObjectId(projectId) });
    await db.collection('projects').deleteOne({ _id: new ObjectId(projectId) });

    res.status(200).json({ success: true, message: 'Projeto deletado com sucesso' });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar projeto' });
  } finally {
    if (client) await client.close();
  }
});

// ANALYTICS
router.get('/analytics/:projectId', authMiddleware, async (req, res) => {
  let client;
  try {
    const { projectId } = req.params;

    client = await MongoClient.connect(uri);
    const db = client.db();

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(req.user.userId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const keys = await db.collection('keys')
      .find({ 
        projectId: new ObjectId(projectId),
        createdAt: { $gte: sevenDaysAgo }
      })
      .toArray();

    const analytics = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      analytics[dateStr] = {
        keysCreated: 0,
        keysActivated: 0,
        executions: 0
      };
    }

    keys.forEach(key => {
      const createdDate = new Date(key.createdAt).toISOString().split('T')[0];
      if (analytics[createdDate]) {
        analytics[createdDate].keysCreated++;
      }

      if (key.status === 'active' && key.firstUsedAt) {
        const activatedDate = new Date(key.firstUsedAt).toISOString().split('T')[0];
        if (analytics[activatedDate]) {
          analytics[activatedDate].keysActivated++;
        }
      }

      if (key.usageCount) {
        const lastUsedDate = new Date(key.lastUsed).toISOString().split('T')[0];
        if (analytics[lastUsedDate]) {
          analytics[lastUsedDate].executions += key.usageCount;
        }
      }
    });

    res.status(200).json({ success: true, analytics });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar analytics' });
  } finally {
    if (client) await client.close();
  }
});

export default router;
