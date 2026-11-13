const header = document.getElementById('header');
const nav = document.getElementById('nav');
const toggle = document.getElementById('menuToggle');

// Mobile menu
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

// Highlight the current page in the menu
const page = location.pathname.split('/').pop() || 'index.html';
nav.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === page));

window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 10), { passive: true });

// Date fields: no past dates (local date, not UTC)
const today = new Date().toLocaleDateString('en-CA');
document.querySelectorAll('input[type="date"]').forEach(d => d.min = today);

// Pre-select department from ?dept=Cardiology (links from Doctors / Departments pages)
const deptParam = new URLSearchParams(location.search).get('dept');
const deptSelect = document.getElementById('dept');
if (deptParam && deptSelect) deptSelect.value = deptParam;

// Doctor dropdown: only show doctors of the chosen department
const doctorSelect = document.getElementById('doctor');
if (deptSelect && doctorSelect) {
  const filterDoctors = () => {
    [...doctorSelect.options].forEach(o => {
      o.hidden = !!o.dataset.dept && !!deptSelect.value && o.dataset.dept !== deptSelect.value;
    });
    if (doctorSelect.selectedOptions[0]?.hidden) doctorSelect.value = '';
  };
  deptSelect.addEventListener('change', filterDoctors);
  filterDoctors();
}

// Forms with data-wa open WhatsApp with the filled-in details; others only confirm on screen.
// shortcut: forms without data-wa are not sent anywhere; give them data-wa or a backend to receive them.
document.querySelectorAll('form[data-success]').forEach(form => form.addEventListener('submit', e => {
  e.preventDefault();
  if (form.dataset.wa) {
    const lines = [...form.elements]
      .filter(el => el.name && el.value.trim())
      .map(el => `${el.labels[0].textContent.replace(' (optional)', '')}: ${el.value.trim()}`);
    const text = `${form.dataset.waTitle || 'Enquiry'} – Pradeep Medical Center\n\n${lines.join('\n')}`;
    window.open(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
  form.querySelector('.form-note').textContent = form.dataset.success.replace('{name}', form.elements.name.value.trim());
  form.reset();
}));

// Doctors page filter
const filters = document.querySelectorAll('.filter');
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.doctor[data-dept]').forEach(d => {
    d.hidden = btn.dataset.filter !== 'all' && d.dataset.dept !== btn.dataset.filter;
  });
}));

// ---------- Animations (all pages) ----------
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Page transition: fade out before opening another page of this site
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || reduceMotion || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || a.target === '_blank') return;
  const url = new URL(a.href, location.href);
  if (url.protocol !== location.protocol || url.host !== location.host || url.pathname === location.pathname) return;
  e.preventDefault();
  document.body.classList.add('leaving');
  setTimeout(() => { location.href = url.href; }, 250);
});
addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving'); }); // back button

// Scroll reveal: common blocks fade up as they enter the screen; grid items are staggered
const revealSel = '.section-head, .split > *, .about > *, .grid > *, .cta, .timeline li, .faq details, .faq-wrap > div:first-child, .svc-row, .appt, .contact > *, .filters';
document.querySelectorAll(revealSel).forEach(el => {
  if (el.closest('.hero, .page-banner, .contact-hero')) return;
  el.classList.add('reveal');
  const parent = el.parentElement;
  if (!el.style.getPropertyValue('--d') && parent.matches('.grid, .faq, .timeline, .split, .about, .contact, .faq-wrap')) {
    el.style.setProperty('--d', ([...parent.children].indexOf(el) % 4) * 0.1 + 's');
  }
});
const reveals = document.querySelectorAll('.reveal');
// Once shown, drop the reveal classes so cards get their normal fast hover transitions back
const settle = el => el.addEventListener('transitionend', function done(ev) {
  if (ev.propertyName !== 'transform') return;
  el.classList.remove('reveal', 'in');
  el.removeEventListener('transitionend', done);
});

// Count-up numbers (15+, 50k+ ...); values like 24/7 are left alone
const countUp = el => {
  const m = el.textContent.trim().match(/^(\d+)(\D*)$/);
  if (!m || m[2].startsWith('/') || reduceMotion) return;
  const end = +m[1], suffix = m[2], t0 = performance.now();
  const step = t => {
    const p = Math.min((t - t0) / 1400, 1);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const counters = document.querySelectorAll('.stats b, .stats-band b, .exp-badge b');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    if (en.target.matches('.reveal')) { settle(en.target); en.target.classList.add('in'); }
    else countUp(en.target);
  }), { threshold: 0.12 });
  reveals.forEach(el => io.observe(el));
  counters.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));
}

document.getElementById('year').textContent = new Date().getFullYear();
