const engine = require('../lib/nlp-engine');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - List documents
  if (req.method === 'GET') {
    const documents = engine.getDocuments();
    const stats = engine.getStats();
    return res.status(200).json({ success: true, documents, stats });
  }

  // DELETE - Remove document
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Döküman ID gerekli' });
    
    engine.removeDocument(id);
    const stats = engine.getStats();
    return res.status(200).json({ success: true, stats, message: 'Döküman silindi' });
  }

  // POST - Export/Import knowledge
  if (req.method === 'POST') {
    const { action, data } = req.body || {};
    
    if (action === 'export') {
      const exported = engine.exportKnowledge();
      return res.status(200).json({ success: true, data: exported });
    }
    
    if (action === 'import' && data) {
      const success = engine.importKnowledge(data);
      if (success) {
        const stats = engine.getStats();
        return res.status(200).json({ success: true, stats, message: 'Bilgi tabanı yüklendi' });
      }
      return res.status(400).json({ error: 'Geçersiz veri formatı' });
    }

    return res.status(400).json({ error: 'Geçersiz istek' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
