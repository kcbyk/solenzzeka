/**
 * Solenz AI - Chat Frontend
 */

const API_BASE = window.location.origin;
let isWelcomeVisible = true;

// ============== INIT ==============
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  
  const input = document.getElementById('chat-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});

// ============== LOAD STATS ==============
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/documents`);
    const data = await res.json();
    if (data.success) {
      const s = data.stats;
      document.getElementById('status-text').textContent =
        `Hazır • ${s.totalDocuments} döküman • ${s.totalWords} kelime`;
    }
  } catch (e) {
    document.getElementById('status-text').textContent = 'Bağlantı bekleniyor...';
  }
}

// ============== SEND MESSAGE ==============
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  // Hide welcome
  if (isWelcomeVisible) {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
      welcome.style.display = 'none';
      isWelcomeVisible = false;
    }
  }

  // Add user message
  addMessage(message, 'user');
  input.value = '';
  input.focus();

  // Show typing
  showTyping(true);

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    showTyping(false);

    if (data.success) {
      addMessage(data.answer, 'ai', {
        confidence: data.confidence,
        sources: data.sources,
        noData: data.noData
      });

      if (data.stats) {
        const s = data.stats;
        document.getElementById('status-text').textContent =
          `Hazır • ${s.totalDocuments} döküman • ${s.totalWords} kelime`;
      }
    } else {
      addMessage('Bir hata oluştu. Lütfen tekrar deneyin. ⚠️', 'ai');
    }
  } catch (error) {
    showTyping(false);
    addMessage('Sunucuya bağlanılamadı. Backend çalışıyor mu? 🔌', 'ai');
  }
}

// ============== ASK QUESTION (from chips) ==============
function askQuestion(question) {
  document.getElementById('chat-input').value = question;
  sendMessage();
}

// ============== ADD MESSAGE ==============
function addMessage(text, type, meta = {}) {
  const chatArea = document.getElementById('chat-area');

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = type === 'ai' ? 'S' : '👤';

  const content = document.createElement('div');
  content.className = 'message-content';

  // Format text with line breaks
  const formattedText = text.replace(/\n/g, '<br>');
  content.innerHTML = formattedText;

  // Add confidence badge for AI messages
  if (type === 'ai' && meta.confidence !== undefined && meta.confidence > 0) {
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';

    const level = meta.confidence >= 60 ? 'high' : meta.confidence >= 30 ? 'medium' : 'low';
    const badge = document.createElement('span');
    badge.className = `confidence-badge ${level}`;
    badge.textContent = `${meta.confidence}% güven`;
    metaDiv.appendChild(badge);

    const time = document.createElement('span');
    time.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    metaDiv.appendChild(time);

    content.appendChild(metaDiv);
  }

  // Add sources
  if (type === 'ai' && meta.sources && meta.sources.length > 0) {
    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'message-sources';
    sourcesDiv.innerHTML = '📎 Kaynaklar: ' +
      meta.sources.map(s => `<span class="source-tag">${s.document} (${s.relevance}%)</span>`).join('');
    content.appendChild(sourcesDiv);
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  chatArea.appendChild(messageDiv);

  // Scroll to bottom
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ============== TYPING INDICATOR ==============
function showTyping(show) {
  const indicator = document.getElementById('typing-indicator');
  const btn = document.getElementById('send-btn');
  indicator.classList.toggle('active', show);
  btn.disabled = show;
}

// ============== TOAST ==============
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
