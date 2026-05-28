import './style.css';

/* ---- STICKY HEADER ---- */
const header = document.getElementById('site-header');
function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 10);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

/* ---- MOBILE NAV ---- */
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

function closeNav() {
  mainNav.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// Close nav on link click
mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeNav);
});

// Close nav when tour button inside nav is clicked
const navTourBtn = document.getElementById('nav-tour-btn');
if (navTourBtn) navTourBtn.addEventListener('click', closeNav);

// Close on outside click
document.addEventListener('click', (e) => {
  if (!header.contains(e.target) && mainNav.classList.contains('open')) closeNav();
});

/* ---- ACTIVE NAV LINK (scroll spy) ---- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

function updateActiveLink() {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}
window.addEventListener('scroll', updateActiveLink, { passive: true });

/* ---- SCROLL REVEAL ---- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function setupReveal() {
  const targets = [
    '.highlight-card',
    '.service-card',
    '.team-card',
    '.review-card',
    '.gallery-item',
    '.about-text',
    '.about-image',
    '.contact-detail',
    '.insurance-block',
    '.map-wrapper',
  ];
  document.querySelectorAll(targets.join(',')).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    revealObserver.observe(el);
  });
}
setupReveal();

/* ---- GALLERY FILTER ---- */
const galleryTabs = document.querySelectorAll('.gallery-tab');
const galleryItems = document.querySelectorAll('.gallery-item');

galleryTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const category = tab.dataset.category;

    galleryTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    galleryItems.forEach(item => {
      const match = category === 'all' || item.dataset.category === category;
      item.classList.toggle('hidden', !match);
    });
  });
});

/* ---- LIGHTBOX ---- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

let currentIndex = 0;
let visibleItems = [];

function getVisibleItems() {
  return Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
}

function openLightbox(index) {
  visibleItems = getVisibleItems();
  currentIndex = index;
  const item = visibleItems[currentIndex];
  lightboxImg.src = item.dataset.src;
  lightboxImg.alt = item.querySelector('img').alt;
  lightboxCaption.textContent = item.dataset.caption || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lightboxImg.focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

function showPrev() {
  currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
  const item = visibleItems[currentIndex];
  lightboxImg.src = item.dataset.src;
  lightboxImg.alt = item.querySelector('img').alt;
  lightboxCaption.textContent = item.dataset.caption || '';
}

function showNext() {
  currentIndex = (currentIndex + 1) % visibleItems.length;
  const item = visibleItems[currentIndex];
  lightboxImg.src = item.dataset.src;
  lightboxImg.alt = item.querySelector('img').alt;
  lightboxCaption.textContent = item.dataset.caption || '';
}

galleryItems.forEach((item, i) => {
  item.addEventListener('click', () => {
    const visible = getVisibleItems();
    const visibleIndex = visible.indexOf(item);
    openLightbox(visibleIndex);
  });
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.click();
    }
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', showPrev);
lightboxNext.addEventListener('click', showNext);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPrev();
  if (e.key === 'ArrowRight') showNext();
});

/* ---- FAQ ACCORDION ---- */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ---- CONTACT FORM ---- */
const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = contactForm.querySelector('#name').value.trim();
  const email = contactForm.querySelector('#email').value.trim();
  const message = contactForm.querySelector('#message').value.trim();

  if (!name || !email || !message) {
    showFormMessage('Please fill in all required fields.', 'error');
    return;
  }

  const btn = contactForm.querySelector('button[type="submit"]');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg> Message Sent!';
  btn.disabled = true;
  btn.style.background = 'var(--success)';

  showFormMessage('Thank you! We\'ll be in touch shortly.', 'success');

  setTimeout(() => {
    contactForm.reset();
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    btn.style.background = '';
    removeFormMessage();
  }, 5000);
});

function showFormMessage(text, type) {
  removeFormMessage();
  const msg = document.createElement('div');
  msg.id = 'form-message';
  msg.textContent = text;
  msg.style.cssText = `
    padding: 12px 16px;
    border-radius: 8px;
    font-size: .9rem;
    font-weight: 500;
    margin-bottom: 12px;
    background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
    color: ${type === 'success' ? '#1a5c2a' : '#721c24'};
    border: 1px solid ${type === 'success' ? '#b3d9c0' : '#f5c6cb'};
  `;
  contactForm.prepend(msg);
}

function removeFormMessage() {
  const existing = document.getElementById('form-message');
  if (existing) existing.remove();
}

/* ---- TOUR SCHEDULING MODAL ---- */
const tourModal = document.getElementById('tour-modal');
const tourForm = document.getElementById('tour-form');
const tourSuccess = document.getElementById('tour-success');
const tourModalClose = document.getElementById('tour-modal-close');
const tourSuccessClose = document.getElementById('tour-success-close');
const tourFormError = document.getElementById('tour-form-error');

// Set minimum date to today (no past dates)
const tourDateInput = document.getElementById('tour-date');
const today = new Date().toISOString().split('T')[0];
tourDateInput.setAttribute('min', today);

function openTourModal() {
  tourModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  tourForm.style.display = '';
  tourSuccess.hidden = true;
  tourForm.reset();
  hideFormError();
}

function closeTourModal() {
  tourModal.classList.remove('open');
  document.body.style.overflow = '';
}

function showFormError(msg) {
  tourFormError.textContent = msg;
  tourFormError.hidden = false;
}

function hideFormError() {
  tourFormError.hidden = true;
  tourFormError.textContent = '';
}

// Open triggers
document.getElementById('nav-tour-btn').addEventListener('click', openTourModal);
document.getElementById('hero-tour-btn').addEventListener('click', openTourModal);

// Close triggers
tourModalClose.addEventListener('click', closeTourModal);
tourSuccessClose.addEventListener('click', closeTourModal);
tourModal.addEventListener('click', (e) => {
  if (e.target === tourModal) closeTourModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tourModal.classList.contains('open')) closeTourModal();
});

// TODO: Replace with Resend API call when client provides API key
function sendTourEmail(data) {
  // Placeholder — wire up to Resend or another email service here
  return Promise.resolve({ ok: true });
}

tourForm.addEventListener('submit', (e) => {
  e.preventDefault();
  hideFormError();

  const date = tourDateInput.value;
  const time = tourForm.querySelector('input[name="tour_time"]:checked')?.value;
  const name = document.getElementById('tour-name').value.trim();
  const email = document.getElementById('tour-email').value.trim();
  const phone = document.getElementById('tour-phone').value.trim();
  const message = document.getElementById('tour-message').value.trim();

  if (!date) { showFormError('Please select a preferred date.'); return; }
  if (!time) { showFormError('Please select a preferred time slot.'); return; }
  if (!name) { showFormError('Please enter your full name.'); return; }
  if (!email) { showFormError('Please enter your email address.'); return; }
  if (!phone) { showFormError('Please enter your phone number.'); return; }

  const tourData = { name, email, phone, date, time, message };

  console.log('[Tour Scheduling] Form submitted:', tourData);

  sendTourEmail(tourData);

  tourForm.style.display = 'none';
  tourSuccess.hidden = false;
});
