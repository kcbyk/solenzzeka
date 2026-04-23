const researcher = require('../../lib/web-researcher');
const brain = require('../../lib/autonomous-brain');
const github = require('../../lib/github-saver');

/**
 * Solenz AI - Cron Learning Task
 * Vercel tarafından periyodik olarak çağrılır.
 */

module.exports = async (req, res) => {
  // Sadece yetkili (veya Vercel Cron) erişimi için basit bir kontrol (isteğe bağlı)
  // if (req.headers['x-vercel-cron'] !== '1') {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  console.log('⏰ Cron Görevi: Otonom Öğrenme Başlatıldı...');

  const topics = [
    '2026 teknoloji trendleri',
    'yapay zeka ve etik',
    'uzay madenciliği son gelişmeler',
    'web 4.0 nedir',
    'kuantum bilgisayar teknolojisi',
    'geleceğin meslekleri',
    'sürdürülebilir enerji çözümleri',
    'robotik ve otomasyon haberleri'
  ];

  // Rastgele bir konu seç
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  try {
    const result = await researcher.performResearch(randomTopic);
    
    if (result.success) {
      // Eğitim setine kaydet
      brain.addToTrainingSet(`Otonom Araştırma: ${randomTopic}`, result.summary);
      
      // GitHub'a gönder (Kalıcı olması için şart)
      github.autoSave();

      return res.status(200).json({
        success: true,
        topic: randomTopic,
        message: 'Yeni bilgiler öğrenildi ve GitHub\'a kaydedildi.'
      });
    }
    
    return res.status(200).json({ success: false, message: 'İnternette yeni bilgi bulunamadı.' });
  } catch (error) {
    console.error('Cron Hatası:', error);
    return res.status(500).json({ error: error.message });
  }
};
