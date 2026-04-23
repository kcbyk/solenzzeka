const engine = require('../lib/nlp-engine');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mesaj boş olamaz' });
    }

    const result = engine.findAnswer(message.trim());
    const stats = engine.getStats();

    return res.status(200).json({
      success: true,
      answer: result.answer,
      confidence: result.confidence,
      sources: result.sources,
      noData: result.noData || false,
      stats: stats
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Bir hata oluştu: ' + error.message });
  }
};
