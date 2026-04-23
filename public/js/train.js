/**
 * Solenz AI - Training Panel Frontend
 */

const API_BASE = window.location.origin;

// ============== INIT ==============
document.addEventListener('DOMContentLoaded', () => {
  loadDocuments();
});

// ============== LOAD DOCUMENTS & STATS ==============
async function loadDocuments() {
  try {
    const res = await fetch(`${API_BASE}/api/documents`);
    const data = await res.json();
    if (data.success) {
      updateStats(data.stats);
      renderDocuments(data.documents);
    }
  } catch (e) {
    showToast('Sunucuya bağlanılamadı', 'error');
  }
}

function updateStats(stats) {
  document.getElementById('stat-docs').textContent = stats.totalDocuments;
  document.getElementById('stat-chunks').textContent = stats.totalChunks;
  document.getElementById('stat-words').textContent = formatNumber(stats.totalWords);
  document.getElementById('stat-vocab').textContent = formatNumber(stats.vocabularySize);
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function renderDocuments(documents) {
  const list = document.getElementById('docs-list');
  const empty = document.getElementById('empty-state');

  if (!documents || documents.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = documents.map(doc => `
    <div class="doc-item" id="doc-${doc.id}">
      <div class="doc-info">
        <div class="doc-name">📄 ${escapeHtml(doc.name)}</div>
        <div class="doc-meta">
          <span>${doc.chunkCount} parça</span>
          <span>${doc.wordCount} kelime</span>
          <span>${formatDate(doc.addedAt)}</span>
        </div>
      </div>
      <button class="doc-delete" onclick="deleteDocument('${doc.id}')" title="Sil">🗑️</button>
    </div>
  `).join('');
}

// ============== FILE UPLOAD ==============
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) processFiles(files);
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) processFiles(files);
  e.target.value = '';
}

async function processFiles(files) {
  const progressBar = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-fill');
  progressBar.classList.add('active');

  let completed = 0;
  const total = files.length;

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      showToast(`${file.name} çok büyük (maks 5MB)`, 'error');
      completed++;
      continue;
    }

    try {
      const text = await readFileAsText(file);
      if (!text.trim()) {
        showToast(`${file.name} boş`, 'error');
        completed++;
        continue;
      }

      const res = await fetch(`${API_BASE}/api/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, content: text })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        if (data.stats) updateStats(data.stats);
      } else {
        showToast(`Hata: ${data.error}`, 'error');
      }
    } catch (e) {
      showToast(`${file.name} yüklenemedi`, 'error');
    }

    completed++;
    progressFill.style.width = `${(completed / total) * 100}%`;
  }

  setTimeout(() => {
    progressBar.classList.remove('active');
    progressFill.style.width = '0%';
    loadDocuments();
  }, 500);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

// ============== TEXT TRAINING ==============
async function trainWithText() {
  const name = document.getElementById('text-name').value.trim();
  const content = document.getElementById('text-content').value.trim();

  if (!content) {
    showToast('Lütfen eğitim metni girin', 'error');
    return;
  }

  const btn = document.getElementById('train-text-btn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Eğitiliyor...';

  try {
    const res = await fetch(`${API_BASE}/api/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Metin_' + Date.now(), content })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      clearTextInputs();
      loadDocuments();
    } else {
      showToast(`Hata: ${data.error}`, 'error');
    }
  } catch (e) {
    showToast('Sunucuya bağlanılamadı', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '🧠 Eğit';
}

function clearTextInputs() {
  document.getElementById('text-name').value = '';
  document.getElementById('text-content').value = '';
}

// ============== DELETE DOCUMENT ==============
async function deleteDocument(id) {
  if (!confirm('Bu dökümanı silmek istediğinize emin misiniz?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/documents`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Döküman silindi', 'success');
      loadDocuments();
    }
  } catch (e) {
    showToast('Silme hatası', 'error');
  }
}

// ============== EXPORT / IMPORT ==============
async function exportKnowledge() {
  try {
    const res = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'export' })
    });

    const data = await res.json();
    if (data.success) {
      const blob = new Blob([data.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solenz-bilgi-tabani-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Bilgi tabanı dışa aktarıldı', 'success');
    }
  } catch (e) {
    showToast('Dışa aktarma hatası', 'error');
  }
}

async function importKnowledge(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await readFileAsText(file);
    const res = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'import', data: text })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Bilgi tabanı yüklendi!', 'success');
      loadDocuments();
    } else {
      showToast(data.error, 'error');
    }
  } catch (err) {
    showToast('İçe aktarma hatası', 'error');
  }

  e.target.value = '';
}

// ============== UTILS ==============
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
