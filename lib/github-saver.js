const nlp = require('./nlp-engine');
const fs = require('fs');
const path = require('path');

/**
 * Solenz AI - GitHub API Saver (Professional Serverless Edition)
 * Bu modül git komutu kullanmadan, doğrudan GitHub API üzerinden dosya günceller.
 * Vercel üzerinde %100 çalışır.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Vercel'e eklenmesi gereken token
const REPO_OWNER = 'kcbyk';
const REPO_NAME = 'solenzzeka';
const FILE_PATH = 'data/knowledge.json';

async function autoSave() {
  if (!GITHUB_TOKEN) {
    console.warn('⚠️ GITHUB_TOKEN eksik! Vercel üzerinden GitHub\'a kayıt yapılamıyor.');
    return;
  }

  console.log('📤 GitHub API üzerinden kayıt başlatıldı...');

  try {
    const content = nlp.exportKnowledge();
    const base64Content = Buffer.from(content).toString('base64');

    // 1. Önce dosyanın mevcut SHA değerini al (Güncelleme için şart)
    const getFileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getRes = await fetch(getFileUrl, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    let sha;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Dosyayı GitHub'a gönder (veya güncelle)
    const putRes = await fetch(getFileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Auto-Learning: ${new Date().toLocaleString('tr-TR')}`,
        content: base64Content,
        sha: sha // Varsa güncelle, yoksa yeni oluşturur
      })
    });

    if (putRes.ok) {
      console.log('✅ GitHub başarıyla güncellendi (API üzerinden).');
    } else {
      const err = await putRes.json();
      console.error('❌ GitHub API Hatası:', err.message);
    }
  } catch (e) {
    console.error('❌ GitHub Kayıt Hatası:', e.message);
  }
}

/**
 * Başlangıçta GitHub'daki en güncel bilgiyi çek ve hafızaya yükle
 */
async function syncFromGitHub() {
  if (!GITHUB_TOKEN) return;
  
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      nlp.importKnowledge(content);
      console.log('🧠 Hafıza GitHub üzerinden senkronize edildi.');
    }
  } catch (e) {
    console.error('Senkronizasyon Hatası:', e);
  }
}

module.exports = { autoSave, syncFromGitHub };
