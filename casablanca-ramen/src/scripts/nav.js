export function initNav() {
  document.querySelectorAll('[data-section]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-section]').forEach((t) => t.removeAttribute('data-active'));
      tab.setAttribute('data-active', '');
      document.getElementById('sec-' + tab.dataset.section)?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id.replace('sec-', '');
          document.querySelectorAll('[data-section]').forEach((t) => {
            if (t.dataset.section === id) t.setAttribute('data-active', '');
            else t.removeAttribute('data-active');
          });
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  ['ramen', 'complementos', 'pastas', 'bebidas', 'postres'].forEach((id) => {
    const el = document.getElementById('sec-' + id);
    if (el) observer.observe(el);
  });
}