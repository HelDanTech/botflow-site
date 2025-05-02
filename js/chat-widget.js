// js/chat-widget.js
document.addEventListener('DOMContentLoaded', () => {
  // 🚩 make sure this matches your ngrok forwarding URL:
  const API_BASE = 'https://6891-102-130-206-189.ngrok-free.app';

  const widget    = document.getElementById('chat-widget');
  const header    = document.getElementById('chat-header');
  const closeBtn  = document.getElementById('chat-close');
  const form      = document.getElementById('chat-form');
  const input     = document.getElementById('chat-input');
  const messages  = document.getElementById('chat-messages');
  const langElems = document.querySelectorAll('.lang');

  let state       = 'init';   // track where we are
  let menuItems   = [];
  let order       = [];
  let currentItem = null;
  let totalPrice  = 0;

  function setLang(lang) {
    langElems.forEach(el => {
      el.textContent = el.getAttribute(`data-${lang}`);
    });
    document.documentElement.lang = lang;
  }
  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  setLang('pt');

  function sendBot(txt) {
    const d = document.createElement('div');
    d.className = 'msg bot';
    d.textContent = txt;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }
  function sendUser(txt) {
    const d = document.createElement('div');
    d.className = 'msg user';
    d.textContent = txt;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  header.addEventListener('click', async () => {
    widget.classList.toggle('open');
    if (state !== 'init') return;
    const lang = document.documentElement.lang;
    sendBot(lang==='pt'
      ? 'Olá! Bem-vindo ao BotFlow Solutions. Carregando cardápio…'
      : 'Hi! Welcome to BotFlow Solutions. Loading menu…'
    );

    // ── Fetch menu with error checks ──
    try {
      console.log('Fetching menu from', `${API_BASE}/api/menu`);
      const res = await fetch(`${API_BASE}/api/menu`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON, got ' + ct);
      }
      menuItems = await res.json();
    } catch (err) {
      console.error('Menu load failed:', err);
      sendBot(lang==='pt'
        ? 'Desculpe, não consegui carregar o cardápio.'
        : 'Sorry, failed to load the menu.'
      );
      return;
    }

    // ── Render menu ──
    const prefix = lang==='pt' ? '' : '';
    menuItems.forEach(item => {
      sendBot(`${item.id}) ${lang==='pt'?item.name_pt:item.name_en} — ${item.price} AOA`);
    });
    sendBot(lang==='pt'
      ? 'Digite o **número** do item que deseja.'
      : 'Please type the **number** of the item you want.'
    );
    state = 'menu';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    sendUser(text);
    input.value = '';
    const lang = document.documentElement.lang;

    try {
      switch (state) {
        case 'menu': {
          const id = parseInt(text, 10);
          currentItem = menuItems.find(i => i.id===id);
          if (!currentItem) {
            sendBot(lang==='pt'
              ? 'Item inválido. Digite um ID válido.'
              : 'Invalid item. Please enter a valid ID.'
            );
          } else {
            sendBot(lang==='pt'
              ? `Quantas unidades de ${currentItem.name_pt}?`
              : `How many of ${currentItem.name_en}?`
            );
            state = 'quantity';
          }
          break;
        }
        case 'quantity': {
          const qty = parseInt(text, 10);
          if (isNaN(qty) || qty<1) {
            sendBot(lang==='pt'
              ? 'Quantidade inválida. Digite um número.'
              : 'Invalid quantity. Please enter a number.'
            );
          } else {
            order.push({ item: currentItem, qty });
            totalPrice += currentItem.price*qty;
            sendBot(lang==='pt'
              ? 'Deseja adicionar mais? (sim/não)'
              : 'Add another? (yes/no)'
            );
            state = 'more';
          }
          break;
        }
        case 'more': {
          if (/^(sim|yes)$/i.test(text)) {
            // re-show menu
            menuItems.forEach(i =>
              sendBot(`${i.id}) ${lang==='pt'?i.name_pt:i.name_en} — ${i.price} AOA`)
            );
            sendBot(lang==='pt'
              ? 'Digite o número do próximo item.'
              : 'Type the next item number.'
            );
            state = 'menu';
          } else {
            sendBot(`${lang==='pt'? 'Total' : 'Total'}: ${totalPrice} AOA. Gerando link de pagamento…`);
            // create-payment
            const payRes = await fetch(`${API_BASE}/api/create-payment`, {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ total: totalPrice })
            });
            if (!payRes.ok) throw new Error(`Pay HTTP ${payRes.status}`);
            const payJson = await payRes.json();
            sendBot(`${lang==='pt'? 'Por favor, pague aqui:' : 'Please pay here:'} ${payJson.paymentUrl}`);
            sendBot(lang==='pt'
              ? 'Após pagar, responda “pago”.'
              : 'After paying, reply “paid”.'
            );
            state = 'payment';
          }
          break;
        }
        case 'payment': {
          if (/^(pago|paid)$/i.test(text)) {
            sendBot(lang==='pt'
              ? 'Quando gostaria de receber? (1) ASAP ou (2) Agendar'
              : 'When would you like delivery? (1) ASAP or (2) Schedule'
            );
            state = 'scheduling';
          } else {
            sendBot(lang==='pt'
              ? 'Aguardando confirmação (“pago”).'
              : 'Waiting for confirmation (“paid”).'
            );
          }
          break;
        }
        case 'scheduling': {
          if (text==='1') {
            sendBot(lang==='pt'
              ? 'Confirmado para ASAP. Obrigado!'
              : 'Confirmed for ASAP. Thanks!'
            );
            state = 'done';
          } else if (text==='2') {
            sendBot(lang==='pt'
              ? 'Digite o horário desejado (ex: 18:30).'
              : 'Enter your desired time (e.g., 18:30).'
            );
            state = 'timeslot';
          } else {
            sendBot(lang==='pt'
              ? 'Responda “1” ou “2”.'
              : 'Please reply “1” or “2”.'
            );
          }
          break;
        }
        case 'timeslot': {
          sendBot(lang==='pt'
            ? `Agendado para ${text}. Obrigado pelo pedido!`
            : `Scheduled for ${text}. Thanks for your order!`
          );
          state = 'done';
          break;
        }
        case 'done': {
          sendBot(lang==='pt'
            ? 'Qualquer coisa, abra o chat novamente.'
            : 'Anything else, just open the chat again.'
          );
          break;
        }
      }
    } catch (err) {
      console.error('Widget error:', err);
      sendBot(lang==='pt'
        ? 'Desculpe, houve um erro interno.'
        : 'Sorry, something went wrong.'
      );
    }
  });
});
