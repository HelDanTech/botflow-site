// Find all elements with class="lang"
const elems = document.querySelectorAll('.lang');
// Language switcher buttons
document.querySelectorAll('.lang-switch button').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.getAttribute('data-lang');
    elems.forEach(el => {
      el.textContent = el.getAttribute(`data-${lang}`);
    });
    document.documentElement.lang = lang;
  });
});

// Initialize default (Português)
elems.forEach(el => {
  el.textContent = el.getAttribute('data-pt');
});
