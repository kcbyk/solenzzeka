const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Solenz AI - GitHub Auto-Saver
 * Öğrenilen bilgileri ve eğitim setlerini otomatik GitHub'a gönderir.
 */

function autoSave() {
  const message = `Auto-Learning Update: ${new Date().toLocaleString('tr-TR')}`;
  const cwd = process.cwd();

  console.log('📤 GitHub Otomatik Kayıt Başlatıldı...');

  // Git komutlarını sırayla çalıştır
  const command = 'git add . && git commit -m "' + message + '" && git push origin main';

  exec(command, { cwd }, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ GitHub Kayıt Hatası: ${error.message}`);
      return;
    }
    console.log('✅ GitHub başarıyla güncellendi.');
  });
}

// Her 30 dakikada bir otomatik kayıt dene (eğer değişiklik varsa)
// Not: Gerçek uygulamada sadece değişiklik olduğunda tetiklemek daha iyidir.
// Biz bunu manuel tetiklenebilir de yapacağız.

module.exports = { autoSave };
