// js/chat-widget.js
document.addEventListener('DOMContentLoaded', () => {
  // ─── 1. SET YOUR PUBLIC API BASE HERE ────────────────────────────────────────
  const API_BASE = 'https://6891-102-130-206-189.ngrok-free.app';
  console.log('🔗 API_BASE is:', API_BASE);

  // ─── 2. CACHE DOM & STATE ────────────────────────────────────────────────────
  const widget    = document.getElementById('chat-widget');
  const header    = document.getElementById('chat-header');
  const closeBtn  = document.getElementById('chat-close');
  const form      = document.getElementById('chat-form');
  const input     = document.getElementById('chat-input');
  const messages  = document.getElementById('chat-messages');
  const langElems = document.querySelectorAll('.lang');
  let state       = 'init';
  let menuItems   = [];
  let order       = [];
  let currentItem = null;
  let totalPrice  = 0;

  // ─── 3. LANGUAGE SWITCHER ───────────────────────────────────────────────────
  function setLang(lang) {
    langElems.forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (el.tagName === 'INPUT') el.placeholder = text;
      else el.textContent = text;
    });
    document.documentElement.lang = lang;
  }
  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  setLang('pt');

  // ─── 4. MESSAGE HELPERS ─────────────────────────────────────────────────────
  function sendBot(txt) {
    const d = document.createElement('div');
    d.className = 'msg bot';
    d.textContent = txt;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
    console.log('Bot message sent:', txt);
  }
  function sendUser(txt) {
    const d = document.createElement('div');
    d.className = 'msg user';
    d.textContent = txt;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  // ─── 5. HEADER CLICK = START FLOW ───────────────────────────────────────────
  header.addEventListener('click', async () => {
    widget.classList.toggle('open');
    if (state !== 'init') return;
    const lang = document.documentElement.lang;

    sendBot(lang === 'pt'
      ? 'Olá! Bem-vindo ao BotFlow Solutions. Carregando cardápio…'
      : 'Hi! Welcome to BotFlow Solutions. Loading menu…'
    );

    let url;
    try {
      url = new URL('/api/menu', API_BASE).toString();
      console.log('Fetching menu from URL:', url);
    } catch (err) {
      console.error('Invalid URL:', err);
      sendBot(lang === 'pt'
        ? 'Erro interno: URL do cardápio inválida.'
        : 'Internal error: invalid menu URL.'
      );
      return;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Expected JSON, got ' + ct);
      menuItems = await res.json();
    } catch (err) {
      console.error('Menu load failed:', err);
      sendBot(lang === 'pt'
        ? 'Desculpe, não consegui carregar o cardápio.'
        : 'Sorry, failed to load the menu.'
      );
      return;
    }

    menuItems.forEach(i => {
      sendBot(`${i.id}) ${lang === 'pt' ? i.name_pt : i.name_en} — ${i.price} AOA`);
    });
    sendBot(lang === 'pt'
      ? 'Digite o número do item que deseja.'
      : 'Please type the item number you want.'
    );
    state = 'menu';
  });

  // ─── 6. FORM SUBMISSION = STATE MACHINE ────────────────────────────────────
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    sendUser(text);
    input.value = '';
    const lang = document.documentElement.lang;

    try {
      switch (state) {
        default:
          sendBot(lang === 'pt'
            ? 'Estado desconhecido.'
            : 'Unknown state.'
          );
      }
    } catch (err) {
      console.error('Flow error:', err);
      sendBot(lang === 'pt'
        ? 'Desculpe, ocorreu um erro.'
        : 'Sorry, an error occurred.'
      );
    }
  });

  closeBtn.addEventListener('click', () => widget.classList.remove('open'));
});
