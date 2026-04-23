const engine = require('../lib/nlp-engine');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'İçerik boş olamaz' });
    }

    const docName = name || 'Isimsiz_' + Date.now();
    const doc = engine.addDocument(docName, content.trim());
    const stats = engine.getStats();

    return res.status(200).json({
      success: true,
      document: doc,
      stats: stats,
      message: `"${docName}" başarıyla eklendi! (${doc.chunkCount} parça, ${doc.wordCount} kelime)`
    });
  } catch (error) {
    console.error('Train error:', error);
    return res.status(500).json({ error: 'Eğitim hatası: ' + error.message });
  }
};
