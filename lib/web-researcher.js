const nlp = require('./nlp-engine');

/**
 * Solenz AI - Web Researcher & Planner
 * Gerçek web araştırması yapar, planlar ve öğrenir.
 */

async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function searchDuckDuckGo(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    let results = [];
    if (data.AbstractText) results.push({ title: data.Heading, text: data.AbstractText, source: 'DuckDuckGo' });
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 3).forEach(t => {
        if (t.Text) results.push({ title: query, text: t.Text, source: 'DDG Related' });
      });
    }
    return results;
  } catch (e) { return []; }
}

async function searchWikipedia(query) {
  try {
    const url = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      return [{ title: data.title, text: data.extract, source: 'Wikipedia' }];
    }
    return [];
  } catch (e) { return []; }
}

/**
 * Araştırma Planı ve Uygulama
 */
async function performResearch(query) {
  console.log(`🔍 Araştırma Planlanıyor: ${query}`);
  
  // Plan: Önce Wikipedia, sonra DDG
  const [wiki, ddg] = await Promise.all([
    searchWikipedia(query),
    searchDuckDuckGo(query)
  ]);

  const allResults = [...wiki, ...ddg];
  
  if (allResults.length > 0) {
    const combinedText = allResults.map(r => `[${r.source}] ${r.text}`).join('\n\n');
    nlp.addDocument(`Web Araştırması: ${query}`, combinedText);
    return {
      success: true,
      results: allResults,
      summary: allResults[0].text
    };
  }
  
  return { success: false };
}

module.exports = { performResearch };
