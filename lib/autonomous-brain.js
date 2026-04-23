const researcher = require('./web-researcher');
const github = require('./github-saver');
const fs = require('fs');
const path = require('path');

/**
 * Solenz AI - Autonomous Brain
 * Arka planda sürekli öğrenen ve gelişen yapı.
 */

const TRAINING_SET_PATH = path.join(process.cwd(), 'data', 'training_set.jsonl');

// Eğitim seti oluşturma (Öğrenilen her şeyi kaydeder)
function addToTrainingSet(prompt, completion) {
  try {
    const entry = JSON.stringify({ prompt, completion, timestamp: new Date().toISOString() }) + '\n';
    fs.appendFileSync(TRAINING_SET_PATH, entry, 'utf8');
  } catch (e) {
    console.error('Eğitim seti kayıt hatası:', e);
  }
}

async function startBackgroundLearning() {
  console.log('🧠 Otonom Zeka Başlatıldı. Uyurken bile öğreneceğim...');

  const topics = [
    'yapay zeka trendleri 2026',
    'yeni yazılım teknolojileri',
    'uzay keşifleri son durum',
    'tıp dünyasındaki buluşlar',
    'kuantum fiziği haberleri'
  ];

  // Her 1 saatte bir rastgele bir konuyu araştır
  setInterval(async () => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    console.log(`🌙 Gece Mesaisi: "${randomTopic}" araştırılıyor...`);
    
    const res = await researcher.performResearch(randomTopic);
    if (res.success) {
      addToTrainingSet(`Araştırma: ${randomTopic}`, res.summary);
      github.autoSave(); // GitHub'a gönder
    }
  }, 1000 * 60 * 60); 
}

module.exports = { startBackgroundLearning, addToTrainingSet };
