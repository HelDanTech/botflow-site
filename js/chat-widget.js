// js/chat-widget.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://019e-102-130-206-189.ngrok-free.app';

  const widget    = document.getElementById('chat-widget');
  const header    = document.getElementById('chat-header');
  const closeBtn  = document.getElementById('chat-close');
  const form      = document.getElementById('chat-form');
  const input     = document.getElementById('chat-input');
  const messages  = document.getElementById('chat-messages');
  const langElems = document.querySelectorAll('.lang');
  let state       = 'init';           // init → menu → selecting → quantity → more? → payment → scheduling → done
  let menuItems   = [];
  let order       = [];
  let currentItem = null;
  let totalPrice  = 0;

  // Language init
  function setLang(lang) {
    langElems.forEach(el =>
      el.textContent = el.getAttribute(`data-${lang}`)
    );
    document.documentElement.lang = lang;
  }
  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  setLang('pt');

  // Helpers to append messages
  function sendBot(msg) {
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.textContent = msg;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
  function sendUser(msg) {
    const div = document.createElement('div');
    div.className = 'msg user';
    div.textContent = msg;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // Step 1: Greeting + load menu
  header.addEventListener('click', async () => {
    widget.classList.toggle('open');
    if (state === 'init') {
      const lang = document.documentElement.lang;
      sendBot(lang === 'pt'
        ? 'Olá! Bem-vindo ao BotFlow Solutions. 📋 Aqui está nosso cardápio:'
        : 'Hi there! Welcome to BotFlow Solutions. 📋 Here is our menu:'
      );
      // fetch menu
      const res = await fetch(`${API_BASE}/api/menu`);
      menuItems = await res.json();
      menuItems.forEach(item => {
        sendBot(`${item.id}) ${lang==='pt'?item.name_pt:item.name_en} — ${item.price} AOA`);
      });
      sendBot(lang === 'pt'
        ? 'Por favor, digite o **número** do item que deseja pedir.'
        : 'Please type the **number** of the item you want to order.'
      );
      state = 'menu';
    }
  });

  // Handle form submit for all steps
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    sendUser(text);
    input.value = '';

    const lang = document.documentElement.lang;

    switch (state) {
      case 'menu':
        // parse chosen ID
        const id = parseInt(text);
        currentItem = menuItems.find(i => i.id === id);
        if (!currentItem) {
          sendBot(lang==='pt'
            ? 'Item não reconhecido. Digite um ID válido.'
            : 'Item not recognized. Please enter a valid ID.'
          );
        } else {
          sendBot(lang==='pt'
            ? `Quantas unidades de ${currentItem.name_pt}?`
            : `How many of ${currentItem.name_en}?`
          );
          state = 'quantity';
        }
        break;

      case 'quantity':
        const qty = parseInt(text);
        if (isNaN(qty) || qty < 1) {
          sendBot(lang==='pt'
            ? 'Informe uma quantidade válida (número).'
            : 'Please provide a valid quantity (number).'
          );
        } else {
          order.push({ item: currentItem, qty });
          totalPrice += currentItem.price * qty;
          sendBot(lang==='pt'
            ? 'Deseja adicionar outro item? (sim/não)'
            : 'Would you like to add another item? (yes/no)'
          );
          state = 'more';
        }
        break;

      case 'more':
        if (/^(sim|yes)$/i.test(text)) {
          // show menu again
          menuItems.forEach(item => {
            sendBot(`${item.id}) ${lang==='pt'?item.name_pt:item.name_en} — ${item.price} AOA`);
          });
          sendBot(lang==='pt'
            ? 'Digite o número do próximo item.'
            : 'Type the number of the next item.'
          );
          state = 'menu';
        } else {
          // proceed to payment
          sendBot(lang==='pt'
            ? `Total: ${totalPrice} AOA. Gerando link de pagamento...`
            : `Total: ${totalPrice} AOA. Generating payment link...`
          );
          const payRes = await fetch(`${API_BASE}/api/create-payment`, {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ total: totalPrice })
          });
          const { paymentUrl } = await payRes.json();
          sendBot(lang==='pt'
            ? `Por favor, pague aqui: ${paymentUrl}`
            : `Please pay here: ${paymentUrl}`
          );
          sendBot(lang==='pt'
            ? 'Depois do pagamento, responda “pago”.'
            : 'After payment, reply “paid”.'
          );
          state = 'payment';
        }
        break;

      case 'payment':
        if (/^(pago|paid)$/i.test(text)) {
          sendBot(lang==='pt'
            ? 'Quando você gostaria de receber? (1) Imediato (30–45 min) ou (2) Agendar'
            : 'When would you like delivery? (1) ASAP (30–45 min) or (2) Schedule'
          );
          state = 'scheduling';
        } else {
          sendBot(lang==='pt'
            ? 'Aguardando confirmação de pagamento (“pago”).'
            : 'Waiting for payment confirmation (“paid”).'
          );
        }
        break;

      case 'scheduling':
        if (text === '1') {
          sendBot(lang==='pt'
            ? 'Perfeito! Seu pedido está confirmado para ASAP. Obrigado!'
            : 'Perfect! Your order is confirmed for ASAP. Thank you!'
          );
          state = 'done';
        } else if (text === '2') {
          sendBot(lang==='pt'
            ? 'Por favor, informe o horário desejado (ex: 18:30).'
            : 'Please enter your desired time (e.g.: 18:30).'
          );
          state = 'timeslot';
        } else {
          sendBot(lang==='pt'
            ? 'Resposta inválida. Digite “1” ou “2”.'
            : 'Invalid response. Enter “1” or “2”.'
          );
        }
        break;

      case 'timeslot':
        // assume valid time
        sendBot(lang==='pt'
          ? `Agendado para ${text}. Obrigado pelo pedido!`
          : `Scheduled for ${text}. Thanks for your order!`
        );
        state = 'done';
        break;

      case 'done':
        sendBot(lang==='pt'
          ? 'Se precisar de mais alguma coisa, basta abrir o chat novamente.'
          : 'If you need anything else, just open the chat again.'
        );
        break;
    }
  });
});
