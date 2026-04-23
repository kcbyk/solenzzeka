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

    let result = engine.findAnswer(message.trim());
    let autoLearned = false;

    // EĞER CEVAP BULUNAMAZSA VEYA GÜVEN DÜŞÜKSE GELİŞMİŞ ARAŞTIRMA YAP
    if (result.noData || result.confidence < 20) {
      const research = require('../lib/web-researcher');
      const brain = require('../lib/autonomous-brain');
      const github = require('../lib/github-saver');

      console.log(`🔎 "${message.trim()}" için araştırma başlatılıyor...`);
      
      try {
        const researchResult = await research.performResearch(message.trim());
        if (researchResult.success) {
          // Yeni bilgilerle tekrar ara
          result = engine.findAnswer(message.trim());
          autoLearned = true;
          
          // Eğitim setine ekle ve GitHub'a gönder
          brain.addToTrainingSet(message.trim(), result.answer);
          github.autoSave(); 
        } else {
          // Araştırma başarısızsa bile en azından "bilmiyorum ama öğrenebilirim" mesajı ver
          result.answer = `Üzgünüm, "${message.trim()}" hakkında şu an internette de net bir bilgi bulamadım. Ama öğrenmeye devam ediyorum! 🔍`;
          result.noData = false; // Hata mesajını ezmek için
        }
      } catch (err) {
        console.error('Araştırma sırasında hata:', err);
      }
    }

    const stats = engine.getStats();

    return res.status(200).json({
      success: true,
      answer: result.answer,
      confidence: result.confidence,
      sources: result.sources,
      noData: result.noData || false,
      autoLearned: autoLearned, // Frontend'de bilgi vermek için
      stats: stats
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Bir hata oluştu: ' + error.message });
  }
};
