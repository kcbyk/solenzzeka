const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.join(process.cwd(), 'data', 'knowledge.json');

/**
 * Solenz AI - NLP Engine (Sıfırdan)
 * Türkçe + İngilizce destekli doğal dil işleme motoru
 * TF-IDF ve Cosine Similarity tabanlı
 */

// ============== STOPWORDS ==============
const TURKISH_STOPWORDS = new Set([
  'bir', 'bu', 'şu', 'o', 've', 'veya', 'ama', 'fakat', 'ile', 'için',
  'de', 'da', 'den', 'dan', 'ne', 'ni', 'nı', 'nu', 'nü', 'mi', 'mı',
  'mu', 'mü', 'ben', 'sen', 'biz', 'siz', 'onlar', 'olan', 'olarak',
  'gibi', 'daha', 'en', 'çok', 'var', 'yok', 'her', 'tüm', 'bütün',
  'kadar', 'sonra', 'önce', 'üzere', 'karşı', 'göre', 'ayrıca', 'ancak',
  'hem', 'ya', 'ki', 'ise', 'bile', 'sadece', 'hep', 'hiç', 'değil',
  'dir', 'dır', 'dur', 'dür', 'tır', 'tir', 'tur', 'tür',
  'oldu', 'olup', 'oluyor', 'olacak', 'olabilir', 'etmek', 'yapmak',
  'kendi', 'hangi', 'nasıl', 'neden', 'nerede', 'zaman', 'böyle', 'öyle'
]);

const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
  'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'out', 'off', 'over', 'under', 'then',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'no', 'not', 'only',
  'same', 'so', 'than', 'too', 'very', 'just', 'but', 'and', 'or', 'if',
  'that', 'this', 'it', 'its', 'i', 'me', 'my', 'we', 'you', 'he', 'she',
  'they', 'them', 'their', 'what', 'which', 'who'
]);

const ALL_STOPWORDS = new Set([...TURKISH_STOPWORDS, ...ENGLISH_STOPWORDS]);

// ============== TOKENIZER ==============
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\sçşğıöüâîûÇŞĞİÖÜ]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !ALL_STOPWORDS.has(t));
}

// ============== TURKISH STEMMER ==============
function stem(word) {
  const suffixes = [
    'ların', 'lerin', 'ında', 'inde', 'ıyla', 'iyle', 'ünde', 'unda',
    'ları', 'leri', 'lar', 'ler', 'dan', 'den', 'tan', 'ten',
    'nın', 'nin', 'nun', 'nün', 'ını', 'ini', 'unu', 'ünü',
    'yla', 'yle', 'dır', 'dir', 'dur', 'dür', 'tır', 'tir',
    'da', 'de', 'ta', 'te', 'ın', 'in', 'un', 'ün',
    'ı', 'i', 'u', 'ü'
  ];
  for (const suffix of suffixes) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

// ============== TEXT PROCESSOR ==============
function processText(text) {
  return tokenize(text).map(t => stem(t));
}

// ============== DOCUMENT CHUNKER ==============
function chunkDocument(text, maxChunkSize = 300) {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  
  if (paragraphs.length > 1) {
    const chunks = [];
    let current = '';
    for (const para of paragraphs) {
      if ((current + ' ' + para).split(/\s+/).length > maxChunkSize && current) {
        chunks.push(current.trim());
        current = para;
      } else {
        current = current ? current + '\n\n' + para : para;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  // Fallback: split by sentences
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).split(/\s+/).length > maxChunkSize && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

// ============== TF-IDF ==============
function computeTF(tokens) {
  const tf = {};
  const total = tokens.length || 1;
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  for (const token in tf) {
    tf[token] = tf[token] / total;
  }
  return tf;
}

function computeIDF(allDocTokens) {
  const idf = {};
  const N = allDocTokens.length || 1;
  for (const docTokens of allDocTokens) {
    const unique = new Set(docTokens);
    for (const term of unique) {
      idf[term] = (idf[term] || 0) + 1;
    }
  }
  for (const term in idf) {
    idf[term] = Math.log((N + 1) / (idf[term] + 1)) + 1;
  }
  return idf;
}

function computeTFIDF(tf, idf) {
  const tfidf = {};
  for (const term in tf) {
    tfidf[term] = tf[term] * (idf[term] || 1);
  }
  return tfidf;
}

// ============== COSINE SIMILARITY ==============
function cosineSimilarity(vecA, vecB) {
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0, magA = 0, magB = 0;
  for (const term of allTerms) {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }
  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ============== KNOWLEDGE STORE ==============
// In-memory store (persists between warm Vercel invocations)
let knowledgeBase = {
  documents: [],  // { id, name, addedAt, chunkCount }
  chunks: [],     // { id, docId, text, tokens, tf }
  idf: {}
};

function rebuildIDF() {
  const allTokens = knowledgeBase.chunks.map(c => c.tokens);
  knowledgeBase.idf = computeIDF(allTokens);
}

function saveToDisk() {
  try {
    const data = JSON.stringify(knowledgeBase, null, 2);
    fs.writeFileSync(STORAGE_PATH, data, 'utf8');
  } catch (e) {
    console.error('Save error:', e);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed.documents && parsed.chunks) {
        knowledgeBase = parsed;
        console.log(`✅ ${knowledgeBase.documents.length} döküman yüklendi.`);
      }
    }
  } catch (e) {
    console.error('Load error:', e);
  }
}

// Initial load
loadFromDisk();

function addDocument(name, text) {
  const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const chunks = chunkDocument(text);
  
  const doc = {
    id: docId,
    name: name,
    addedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    wordCount: text.split(/\s+/).length
  };
  knowledgeBase.documents.push(doc);
  
  for (let i = 0; i < chunks.length; i++) {
    const tokens = processText(chunks[i]);
    const tf = computeTF(tokens);
    knowledgeBase.chunks.push({
      id: docId + '_chunk_' + i,
      docId: docId,
      text: chunks[i],
      tokens: tokens,
      tf: tf
    });
  }
  
  rebuildIDF();
  saveToDisk();
  return doc;
}

function removeDocument(docId) {
  knowledgeBase.documents = knowledgeBase.documents.filter(d => d.id !== docId);
  knowledgeBase.chunks = knowledgeBase.chunks.filter(c => c.docId !== docId);
  rebuildIDF();
  saveToDisk();
}

function getDocuments() {
  return knowledgeBase.documents;
}

function getStats() {
  return {
    totalDocuments: knowledgeBase.documents.length,
    totalChunks: knowledgeBase.chunks.length,
    totalWords: knowledgeBase.documents.reduce((sum, d) => sum + (d.wordCount || 0), 0),
    vocabularySize: Object.keys(knowledgeBase.idf).length
  };
}

// ============== SEARCH / CHAT ==============
function findAnswer(query, topK = 3) {
  if (knowledgeBase.chunks.length === 0) {
    return {
      answer: 'Henüz eğitilmedim! Lütfen önce Eğitim Paneli\'nden döküman yükleyin. 📚',
      confidence: 0,
      sources: [],
      noData: true
    };
  }

  const queryTokens = processText(query);
  if (queryTokens.length === 0) {
    return {
      answer: 'Sorunuzu anlayamadım. Lütfen daha detaylı bir soru sorun. 🤔',
      confidence: 0,
      sources: [],
      noData: false
    };
  }

  const queryTF = computeTF(queryTokens);
  const queryTFIDF = computeTFIDF(queryTF, knowledgeBase.idf);

  // Score all chunks
  const scored = knowledgeBase.chunks.map(chunk => {
    const chunkTFIDF = computeTFIDF(chunk.tf, knowledgeBase.idf);
    const similarity = cosineSimilarity(queryTFIDF, chunkTFIDF);
    
    // Bonus: exact keyword match boost
    let keywordBoost = 0;
    for (const qt of queryTokens) {
      if (chunk.tokens.includes(qt)) keywordBoost += 0.05;
    }
    
    return {
      chunk: chunk,
      score: similarity + keywordBoost,
      docName: knowledgeBase.documents.find(d => d.id === chunk.docId)?.name || 'Bilinmeyen'
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK).filter(r => r.score > 0.01);

  if (topResults.length === 0) {
    return {
      answer: 'Bu konuda bilgi bulamadım. Eğitim verilerimde bu konu henüz yok. 🔍',
      confidence: 0,
      sources: []
    };
  }

  const bestScore = topResults[0].score;
  const confidence = Math.min(Math.round(bestScore * 100), 99);

  // Build answer from top results
  let answer = '';
  if (topResults.length === 1) {
    answer = topResults[0].chunk.text;
  } else {
    // Combine relevant chunks
    const seen = new Set();
    for (const result of topResults) {
      if (!seen.has(result.chunk.text.substring(0, 50))) {
        if (answer) answer += '\n\n';
        answer += result.chunk.text;
        seen.add(result.chunk.text.substring(0, 50));
      }
    }
  }

  // Trim answer if too long
  if (answer.length > 1500) {
    answer = answer.substring(0, 1500) + '...';
  }

  const sources = topResults.map(r => ({
    document: r.docName,
    relevance: Math.round(r.score * 100)
  }));

  return { answer, confidence, sources };
}

// ============== IMPORT/EXPORT ==============
function exportKnowledge() {
  return JSON.stringify(knowledgeBase);
}

function importKnowledge(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.documents && data.chunks) {
      knowledgeBase = data;
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

module.exports = {
  addDocument,
  removeDocument,
  getDocuments,
  getStats,
  findAnswer,
  exportKnowledge,
  importKnowledge,
  tokenize,
  processText,
  chunkDocument
};
