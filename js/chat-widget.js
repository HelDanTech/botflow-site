document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('chat-widget');
    const header = document.getElementById('chat-header');
    const closeBtn = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    const langElems = document.querySelectorAll('.lang');
  
    // Language init
    function setLang(lang) {
      langElems.forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
      });
      document.documentElement.lang = lang;
    }
    // preserve your existing lang-switch code…
  
    // Toggle open/close
    header.addEventListener('click', () => widget.classList.toggle('open'));
    closeBtn.addEventListener('click', () => widget.classList.remove('open'));
  
    // Simple echo bot for now
    form.addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      // user message
      const userMsg = document.createElement('div');
      userMsg.className = 'msg user';
      userMsg.textContent = text;
      messages.appendChild(userMsg);
      input.value = '';
      messages.scrollTop = messages.scrollHeight;
      // bot reply placeholder
      setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'msg bot';
        botMsg.textContent = 'Obrigado por sua mensagem! Em breve retornaremos.'; 
        // For English users you could detect lang and set English text.
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
      }, 600);
    });
  });
  