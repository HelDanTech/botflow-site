// Fade-in on scroll using IntersectionObserver
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
  
    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  });
  