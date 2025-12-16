// VALIDAR KEY - Simples e direto
router.post('/validate-key', async (req, res) => {
  let client;
  try {
    const { key, hwid, projectId } = req.body;

    if (!key || !hwid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Key e HWID obrigatórios' 
      });
    }

    client = await MongoClient.connect(uri);
    const db = client.db();

    // Busca a key
    const keyDoc = await db.collection('keys').findOne({ key });

    if (!keyDoc) {
      return res.status(404).json({ success: false, error: 'Key inválida' });
    }

    // Verifica projeto (se enviado)
    if (projectId && keyDoc.projectId.toString() !== projectId) {
      return res.status(403).json({ success: false, error: 'Key não pertence a este projeto' });
    }

    // Verifica status
    if (keyDoc.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Key banida' });
    }

    // Verifica expiração
    if (keyDoc.expiresAt && new Date() > new Date(keyDoc.expiresAt)) {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { $set: { status: 'expired' } }
      );
      return res.status(403).json({ success: false, error: 'Key expirada' });
    }

    // PRIMEIRA VEZ? Registra HWID
    if (keyDoc.hwid === null) {
      const now = new Date();
      const expiresAt = keyDoc.duration === 0 ? null : new Date(now.getTime() + keyDoc.duration * 24 * 60 * 60 * 1000);
      
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { 
          $set: { 
            hwid, 
            status: 'active',
            firstUsedAt: now,
            lastUsed: now,
            expiresAt: expiresAt
          },
          $inc: { usageCount: 1 }
        }
      );
      
      await db.collection('projects').updateOne(
        { _id: keyDoc.projectId },
        { 
          $inc: { 
            'stats.activeKeys': 1,
            'stats.totalValidations': 1
          }
        }
      );
      
    // HWID diferente? ERRO
    } else if (keyDoc.hwid !== hwid) {
      return res.status(403).json({ success: false, error: 'HWID não corresponde' });
      
    // OK! Atualiza uso
    } else {
      await db.collection('keys').updateOne(
        { _id: keyDoc._id },
        { 
          $set: { lastUsed: new Date() },
          $inc: { usageCount: 1 }
        }
      );
      
      await db.collection('projects').updateOne(
        { _id: keyDoc.projectId },
        { $inc: { 'stats.totalValidations': 1 } }
      );
    }

    // SUCESSO!
    res.status(200).json({
      success: true,
      message: 'Key válida!'
    });

  } catch (error) {
    console.error('Validate key error:', error);
    res.status(500).json({ success: false, error: 'Erro no servidor' });
  } finally {
    if (client) await client.close();
  }
});

export default router;
