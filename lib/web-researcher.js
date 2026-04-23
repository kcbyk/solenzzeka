const nlp = require('./nlp-engine');

/**
 * Solenz AI - Focus & Deep Researcher
 * Konu dışına çıkmadan, sadece alakalı bilgileri süzer ve derinleşir.
 */

async function fetchWithTimeout(url, timeout = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'SolenzAI/3.0 FocusBot' }
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

/**
 * Alakalılık Kontrolü (Keyword matching)
 */
function isRelevant(text, query) {
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 3);
  let matches = 0;
  keywords.forEach(k => {
    if (text.toLowerCase().includes(k)) matches++;
  });
  // En az %40 anahtar kelime eşleşmesi veya konunun geçmesi lazım
  return matches >= Math.max(1, Math.floor(keywords.length * 0.4));
}

async function searchWikipedia(query) {
  try {
    // ARAMA YAP (Search)
    const searchUrl = `https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchRes = await fetchWithTimeout(searchUrl);
    const searchData = await searchRes.json();
    
    if (searchData.query && searchData.query.search.length > 0) {
      // En alakalı 2 sonucu kontrol et
      for (const item of searchData.query.search.slice(0, 2)) {
        const summaryUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`;
        const summaryRes = await fetchWithTimeout(summaryUrl);
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          // Sadece konumuzla Alakalıysa al
          if (isRelevant(data.extract, query)) {
            return [{ title: data.title, text: data.extract, source: 'Wikipedia' }];
          }
        }
      }
    }
    return [];
  } catch (e) { return []; }
}

async function performResearch(query, depth = 1) {
  console.log(`🎯 Odaklı Araştırma [Derinlik ${depth}]: "${query}"`);
  
  const allResults = await searchWikipedia(query);
  
  if (allResults.length > 0) {
    // KALİTE FİLTRESİ: Çok kısa veya anlamsız sonuçları ele
    const qualityResults = allResults.filter(r => r.text.length > 100 && !r.text.includes('tanımlanmamış'));
    
    if (qualityResults.length > 0) {
      const knowledge = qualityResults.map(r => `[${r.source}] ${r.text}`).join('\n\n');
      nlp.addDocument(`Odaklı: ${query}`, knowledge);
      
      // DERİNLEŞME
      if (depth > 0) {
        const subTopics = extractSubTopics(qualityResults[0].text, query);
        for (const sub of subTopics) {
          await performResearch(sub, depth - 1);
        }
      }
      return { success: true, summary: qualityResults[0].text };
    }
  }
  
  return { success: false };
}

/**
 * Metinden alt başlıklar çıkar (Daha çok öğrenmek için)
 */
function extractSubTopics(text, originalQuery) {
  // Basit bir yöntem: Büyük harfle başlayan ve stopwords olmayan kelime gruplarını bul
  const words = text.split(/\s+/);
  const potentialTopics = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i][0] === words[i][0].toUpperCase() && words[i].length > 4) {
      const pair = words[i] + " " + words[i+1];
      if (!originalQuery.includes(words[i])) potentialTopics.push(pair);
    }
  }
  return [...new Set(potentialTopics)].slice(0, 2);
}

module.exports = { performResearch };
