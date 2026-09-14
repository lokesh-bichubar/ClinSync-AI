'use strict';
const nav = document.getElementById('nav');
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMobile');
const close = document.getElementById('navClose');
const backdrop = document.getElementById('navBackdrop');
let previousFocus;
function setMenu(open) {
  if (open) previousFocus = document.activeElement;
  menu.classList.toggle('open', open);
  menu.setAttribute('aria-hidden', String(!open));
  toggle.setAttribute('aria-expanded', String(open));
  backdrop.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) close.focus();
  else if (previousFocus) previousFocus.focus();
}
toggle.addEventListener('click', () => setMenu(true));
close.addEventListener('click', () => setMenu(false));
backdrop.addEventListener('click', () => setMenu(false));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
  if (!menu.classList.contains('open')) return;
  if (e.key === 'Escape') setMenu(false);
  if (e.key === 'Tab') {
    const items = [...menu.querySelectorAll('button,a')];
    if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
  }
});
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reduced.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0, rootMargin:'0px 0px 40px 0px'});
  document.querySelectorAll('.reveal').forEach(el => {
    el.classList.add('reveal-pending'); observer.observe(el);
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) document.querySelectorAll('.reveal').forEach(el => el.classList.remove('reveal-pending'));
  });
}
let ticking = false;
function update() {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  const track = document.querySelector('.workflow-track');
  if (track) {
    const rect = track.getBoundingClientRect();
    const progress = Math.max(0, Math.min(window.innerHeight * .75 - rect.top, rect.height));
    document.getElementById('wfFill').style.height = (rect.height ? progress / rect.height * 100 : 0) + '%';
    document.querySelectorAll('.wf-step').forEach(step => step.classList.toggle('active', step.getBoundingClientRect().top < window.innerHeight * .75));
  }
  ticking = false;
}
function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
window.addEventListener('scroll', schedule, {passive:true});
window.addEventListener('resize', () => { if (innerWidth > 900 && menu.classList.contains('open')) setMenu(false); schedule(); });
update();
