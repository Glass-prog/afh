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

/* ---- EMAIL HELPER ---- */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function sendEmail(payload) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

/* ---- CONTACT TABS ---- */
const tabTour = document.getElementById('tab-tour');
const tabMessage = document.getElementById('tab-message');
const panelTour = document.getElementById('panel-tour');
const panelMessage = document.getElementById('panel-message');

tabTour.addEventListener('click', () => {
  tabTour.classList.add('active');
  tabTour.setAttribute('aria-selected', 'true');
  tabMessage.classList.remove('active');
  tabMessage.setAttribute('aria-selected', 'false');
  panelTour.hidden = false;
  panelMessage.hidden = true;
});

tabMessage.addEventListener('click', () => {
  tabMessage.classList.add('active');
  tabMessage.setAttribute('aria-selected', 'true');
  tabTour.classList.remove('active');
  tabTour.setAttribute('aria-selected', 'false');
  panelMessage.hidden = false;
  panelTour.hidden = true;
});

/* ---- INLINE TOUR FORM ---- */
const inlineTourForm = document.getElementById('inline-tour-form');
const inlineTourError = document.getElementById('inline-tour-error');
const inlineTourSuccess = document.getElementById('inline-tour-success');
const itDateInput = document.getElementById('it-date');
if (itDateInput) itDateInput.setAttribute('min', new Date().toISOString().split('T')[0]);

inlineTourForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  inlineTourError.hidden = true;

  const name = document.getElementById('it-name').value.trim();
  const phone = document.getElementById('it-phone').value.trim();
  const email = document.getElementById('it-email').value.trim();
  const date = document.getElementById('it-date').value;
  const time = document.getElementById('it-time').value;
  const message = document.getElementById('it-message').value.trim();

  if (!name) { inlineTourError.textContent = 'Please enter your full name.'; inlineTourError.hidden = false; return; }
  if (!phone) { inlineTourError.textContent = 'Please enter your phone number.'; inlineTourError.hidden = false; return; }
  if (!email) { inlineTourError.textContent = 'Please enter your email address.'; inlineTourError.hidden = false; return; }
  if (!date) { inlineTourError.textContent = 'Please select a preferred date.'; inlineTourError.hidden = false; return; }
  if (!time) { inlineTourError.textContent = 'Please select a preferred time.'; inlineTourError.hidden = false; return; }

  const btn = inlineTourForm.querySelector('button[type="submit"]');
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Sending...';

  const ok = await sendEmail({ type: 'tour', name, email, phone, date, time, message });

  if (ok) {
    inlineTourSuccess.hidden = false;
    inlineTourSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    inlineTourForm.reset();
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
    inlineTourError.textContent = 'Something went wrong. Please call us at (253) 737-5302.';
    inlineTourError.hidden = false;
  }
});

/* ---- CONTACT FORM ---- */
const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = contactForm.querySelector('#name').value.trim();
  const email = contactForm.querySelector('#email').value.trim();
  const phone = contactForm.querySelector('#phone').value.trim();
  const message = contactForm.querySelector('#message').value.trim();

  if (!name || !email || !message) {
    showFormMessage('Please fill in all required fields.', 'error');
    return;
  }

  const btn = contactForm.querySelector('button[type="submit"]');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/></svg> Sending...';
  btn.disabled = true;

  const ok = await sendEmail({ type: 'contact', name, email, phone, message });

  if (ok) {
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg> Message Sent!';
    btn.style.background = 'var(--success)';
    showFormMessage('Thank you! We\'ll be in touch shortly.', 'success');
    setTimeout(() => {
      contactForm.reset();
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      btn.style.background = '';
      removeFormMessage();
    }, 5000);
  } else {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    showFormMessage('Something went wrong. Please try emailing us directly at atticafh25@gmail.com.', 'error');
  }
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

/* ---- CAREERS FORM ---- */
const careerForm = document.getElementById('career-form');
const careerFormError = document.getElementById('career-form-error');
const careerFormSuccess = document.getElementById('career-form-success');
const fileUploadWrap = document.getElementById('file-upload-wrap');
const fileInput = document.getElementById('career-resume');
const fileSelected = document.getElementById('file-selected');
const fileSelectedName = document.getElementById('file-selected-name');
const fileRemove = document.getElementById('file-remove');

if (fileInput) {
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      fileSelectedName.textContent = file.name;
      fileSelected.hidden = false;
      fileUploadWrap.querySelector('.file-upload-ui').style.display = 'none';
    }
  });

  fileUploadWrap.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadWrap.classList.add('drag-over');
  });
  fileUploadWrap.addEventListener('dragleave', () => fileUploadWrap.classList.remove('drag-over'));
  fileUploadWrap.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadWrap.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileSelectedName.textContent = file.name;
      fileSelected.hidden = false;
      fileUploadWrap.querySelector('.file-upload-ui').style.display = 'none';
    }
  });

  fileRemove.addEventListener('click', () => {
    fileInput.value = '';
    fileSelected.hidden = true;
    fileUploadWrap.querySelector('.file-upload-ui').style.display = '';
  });
}

if (careerForm) {
  careerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    careerFormError.hidden = true;

    const name = document.getElementById('career-name').value.trim();
    const phone = document.getElementById('career-phone').value.trim();
    const email = document.getElementById('career-email').value.trim();
    const message = document.getElementById('career-message').value.trim();
    const resumeFile = fileInput.files[0];

    if (!name) { careerFormError.textContent = 'Please enter your full name.'; careerFormError.hidden = false; return; }
    if (!phone) { careerFormError.textContent = 'Please enter your phone number.'; careerFormError.hidden = false; return; }
    if (!email) { careerFormError.textContent = 'Please enter your email address.'; careerFormError.hidden = false; return; }
    if (!resumeFile) { careerFormError.textContent = 'Please attach your resume.'; careerFormError.hidden = false; return; }

    const maxSize = 5 * 1024 * 1024;
    if (resumeFile.size > maxSize) {
      careerFormError.textContent = 'Resume file is too large. Maximum size is 5 MB.';
      careerFormError.hidden = false;
      return;
    }

    const btn = document.getElementById('career-submit');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Submitting...';

    const formData = new FormData();
    formData.append('type', 'careers');
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('message', message);
    formData.append('resume', resumeFile);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: formData,
      });

      if (res.ok) {
        careerFormSuccess.hidden = false;
        careerFormSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        careerForm.reset();
        fileSelected.hidden = true;
        if (fileUploadWrap) fileUploadWrap.querySelector('.file-upload-ui').style.display = '';
      } else {
        throw new Error('Server error');
      }
    } catch {
      careerFormError.textContent = 'Something went wrong. Please email your resume to atticafh25@gmail.com.';
      careerFormError.hidden = false;
    }

    btn.disabled = false;
    btn.innerHTML = originalHTML;
  });
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

tourForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideFormError();

  const date = tourDateInput.value;
  const time = document.getElementById('tour-time-select').value;
  const name = document.getElementById('tour-name').value.trim();
  const email = document.getElementById('tour-email').value.trim();
  const phone = document.getElementById('tour-phone').value.trim();
  const message = document.getElementById('tour-message').value.trim();

  if (!date) { showFormError('Please select a preferred date.'); return; }
  if (!time) { showFormError('Please select a preferred time.'); return; }
  if (!name) { showFormError('Please enter your full name.'); return; }
  if (!email) { showFormError('Please enter your email address.'); return; }
  if (!phone) { showFormError('Please enter your phone number.'); return; }

  const submitBtn = tourForm.querySelector('button[type="submit"]');
  const originalBtnHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Sending...';

  const ok = await sendEmail({ type: 'tour', name, email, phone, date, time, message });

  if (ok) {
    tourForm.style.display = 'none';
    tourSuccess.hidden = false;
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHTML;
    showFormError('Something went wrong. Please call us at (253) 737-5302 to schedule your tour.');
  }
});
