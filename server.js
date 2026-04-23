/**
 * Solenz AI - Local Development Server
 * Vercel'e deploy edildiğinde api/ klasöründeki dosyalar otomatik serverless olur.
 * Bu dosya sadece local geliştirme içindir.
 */
const express = require('express');
const path = require('path');

const chatHandler = require('./api/chat');
const trainHandler = require('./api/train');
const documentsHandler = require('./api/documents');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/chat', (req, res) => chatHandler(req, res));
app.post('/api/train', (req, res) => trainHandler(req, res));
app.get('/api/documents', (req, res) => documentsHandler(req, res));
app.delete('/api/documents', (req, res) => documentsHandler(req, res));
app.post('/api/documents', (req, res) => documentsHandler(req, res));

// Pages
app.get('/train', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'train.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Otonom Zekayı Başlat
const github = require('./lib/github-saver');
const brain = require('./lib/autonomous-brain');

// GitHub'dan hafızayı çek ve sonra zekayı başlat
github.syncFromGitHub().then(() => {
  brain.startBackgroundLearning();
});

app.listen(PORT, () => {
  console.log(`\n🧠 Solenz AI çalışıyor!`);
  console.log(`   💬 Chat: http://localhost:${PORT}`);
  console.log(`   📚 Eğitim: http://localhost:${PORT}/train\n`);
});
