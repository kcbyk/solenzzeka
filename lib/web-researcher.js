const nlp = require('./nlp-engine');

/**
 * Solenz AI - Professional Web Researcher
 * Gerçek arama yaparak bilgi toplar ve analiz eder.
 */

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'SolenzAI/2.0 ResearchBot' }
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

/**
 * Wikipedia'da gerçek bir arama yapar
 */
async function searchWikipedia(query) {
  try {
    // 1. Önce konuyu ARA (Search)
    const searchUrl = `https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchRes = await fetchWithTimeout(searchUrl);
    const searchData = await searchRes.json();
    
    if (searchData.query && searchData.query.search.length > 0) {
      // En alakalı ilk sonucun başlığını al
      const bestTitle = searchData.query.search[0].title;
      
      // 2. Bu başlığın ÖZETİNİ çek
      const summaryUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
      const summaryRes = await fetchWithTimeout(summaryUrl);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        return [{ 
          title: data.title, 
          text: data.extract, 
          source: 'Wikipedia',
          url: data.content_urls?.desktop?.page 
        }];
      }
    }
    return [];
  } catch (e) { 
    console.error('Wiki Arama Hatası:', e);
    return []; 
  }
}

/**
 * DuckDuckGo üzerinden genel arama
 */
async function searchWeb(query) {
  try {
    // DDG Instant Answer bazen yetersiz kalır, ancak hızlıdır
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    let results = [];
    
    if (data.AbstractText) {
      results.push({ title: data.Heading, text: data.AbstractText, source: 'DuckDuckGo' });
    }
    
    // Eğer sonuç yoksa RelatedTopics içinden metin çekmeye çalış
    if (results.length === 0 && data.RelatedTopics) {
      for (let t of data.RelatedTopics) {
        if (t.Text && t.Text.length > 50) {
          results.push({ title: query, text: t.Text, source: 'Web Kaynağı' });
          break;
        }
      }
    }
    return results;
  } catch (e) { return []; }
}

async function performResearch(query) {
  console.log(`🚀 Akıllı Araştırma Başladı: "${query}"`);
  
  // Paralel olarak hem Wikipedia'da hem Web'de ara
  const [wikiResults, webResults] = await Promise.all([
    searchWikipedia(query),
    searchWeb(query)
  ]);

  const allResults = [...wikiResults, ...webResults];
  
  if (allResults.length > 0) {
    // Bilgiyi NLP motoruna öğret
    const combinedKnowledge = allResults.map(r => `[${r.source}] ${r.text}`).join('\n\n');
    nlp.addDocument(`Araştırma: ${query}`, combinedKnowledge);
    
    return {
      success: true,
      results: allResults,
      summary: allResults[0].text,
      allText: combinedKnowledge
    };
  }
  
  return { success: false };
}

module.exports = { performResearch };
