const nlp = require('./nlp-engine');

/**
 * Solenz AI - Web Learner Module
 * Bu modül internetten bilgi toplayıp sisteme öğretir.
 */
async function learnFromWeb(query) {
  console.log(`🌍 İnternette araştırılıyor: ${query}`);
  
  try {
    // DuckDuckGo API (Hızlı özetler için)
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    let findings = [];

    // 1. Ana özet (Abstract)
    if (data.AbstractText) {
      findings.push({
        title: data.AbstractSource || query,
        text: data.AbstractText
      });
    }

    // 2. İlgili başlıklar (Related Topics)
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 3).forEach(topic => {
        if (topic.Text && !topic.Name) { // Sadece metin içerenleri al (kategori başlıklarını değil)
          findings.push({
            title: query + ' (Ek Bilgi)',
            text: topic.Text
          });
        }
      });
    }

    if (findings.length > 0) {
      for (const item of findings) {
        nlp.addDocument(`Öğrenilen: ${item.title}`, item.text);
      }
      return { success: true, count: findings.length, preview: findings[0].text };
    }

    return { success: false, message: "İnternette yeterli bilgi bulunamadı." };
  } catch (error) {
    console.error("Web Öğrenme Hatası:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { learnFromWeb };
