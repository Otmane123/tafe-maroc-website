/**
 * FieldsMotors Agricole - Core JavaScript
 * Navigation, animations, counters, lightbox, forms
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Init i18n
  await I18n.init();

  // Init all modules
  initHeader();
  initScrollReveal();
  initCounters();
  initGallery();
  initLightbox();
  initForms();
  initProgressBars();
  initActiveNav();
  initLangSwitcher();
});

/* ── Header & Navigation ── */
function initHeader() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  // Sticky scroll effect
  const onScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  toggle?.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('open');
    mobileNav?.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (mobileNav?.classList.contains('open') &&
        !mobileNav.contains(e.target) &&
        !toggle?.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Close on nav link click
  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMobileMenu);
  });

  function closeMobileMenu() {
    toggle?.classList.remove('open');
    mobileNav?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

/* ── Active Nav Link ── */
function initActiveNav() {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
  const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const isHome = (href === '/' || href === '/index.html' || href === 'index.html');
    const isCurrentHome = (currentPath === '/' || currentPath.endsWith('index.html'));

    let active = false;
    if (isHome && isCurrentHome) {
      active = true;
    } else if (!isHome && currentPath.endsWith(href.replace(/^\//, '').replace(/^\.\//, ''))) {
      active = true;
    }
    link.classList.toggle('active', active);
  });
}

/* ── Language Switcher ── */
function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      I18n.setLang(lang);
    });
  });
}

/* ── Scroll Reveal ── */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // For timeline items
        if (entry.target.classList.contains('timeline-item')) {
          entry.target.classList.add('visible');
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  els.forEach(el => observer.observe(el));

  // Also observe timeline items
  document.querySelectorAll('.timeline-item').forEach(item => {
    observer.observe(item);
  });
}

/* ── Animated Counters ── */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-counter'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const prefix = el.getAttribute('data-prefix') || '';
  const duration = 2000;
  const start = performance.now();

  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = prefix + current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

/* ── Progress Bars ── */
function initProgressBars() {
  const bars = document.querySelectorAll('.progress-fill[data-target]');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target.getAttribute('data-target');
        setTimeout(() => {
          entry.target.style.width = target + '%';
        }, 200);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => observer.observe(bar));
}

/* ── Gallery Filter ── */
function initGallery() {
  const filterBtns = document.querySelectorAll('.gallery-filter .filter-pill');
  const items = document.querySelectorAll('.gallery-item');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      items.forEach(item => {
        const categories = item.getAttribute('data-category') || '';
        const show = filter === 'all' || categories.includes(filter);

        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        if (show) {
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
          item.style.display = '';
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (!categories.includes(filterBtns[0]?.getAttribute('data-filter') === 'all' ? categories : filter)) {
              // re-check
            }
          }, 300);
        }
      });

      // Simpler approach: just toggle visibility
      items.forEach(item => {
        const cats = item.getAttribute('data-category') || '';
        const visible = filter === 'all' || cats.split(',').map(s=>s.trim()).includes(filter);
        item.style.display = visible ? '' : 'none';
      });
    });
  });
}

/* ── Lightbox ── */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const img = lightbox.querySelector('.lightbox-img');
  const caption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  let items = [];
  let currentIndex = 0;

  // Open lightbox when gallery item clicked
  document.querySelectorAll('.gallery-item[data-src]').forEach((item, idx) => {
    item.addEventListener('click', () => {
      items = Array.from(document.querySelectorAll('.gallery-item[data-src]'));
      currentIndex = items.indexOf(item);
      showImage(currentIndex);
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    // Keyboard accessibility
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  function showImage(idx) {
    const item = items[idx];
    if (!item) return;
    const src = item.getAttribute('data-src');
    const cap = item.getAttribute('data-caption') || '';
    if (img) img.src = src;
    if (caption) caption.textContent = cap;
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (img) img.src = '';
    }, 400);
  }

  function prev() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    showImage(currentIndex);
  }

  function next() {
    currentIndex = (currentIndex + 1) % items.length;
    showImage(currentIndex);
  }

  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  // Close on backdrop click
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') {
      document.dir === 'rtl' ? next() : prev();
    }
    if (e.key === 'ArrowRight') {
      document.dir === 'rtl' ? prev() : next();
    }
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) {
      diff < 0 ? next() : prev();
    }
  });
}

/* ── Forms ── */
function initForms() {
  // Contact Form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit);
  }

  // Quote Form
  const quoteForm = document.getElementById('quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', handleFormSubmit);
  }

  // Real-time validation
  document.querySelectorAll('.form-input[required], .form-textarea[required], .form-select[required]')
    .forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateField(field);
      });
    });
}

function validateField(field) {
  const value = field.value.trim();
  let valid = true;
  let errorMsg = '';

  if (field.required && !value) {
    valid = false;
    errorMsg = I18n.t('contact.required');
  } else if (field.type === 'tel' && value) {
    const phoneRegex = /^[+]?[\d\s\-().]{8,20}$/;
    if (!phoneRegex.test(value)) {
      valid = false;
      errorMsg = 'Numéro invalide';
    }
  } else if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      valid = false;
      errorMsg = 'Email invalide';
    }
  }

  field.classList.toggle('error', !valid);
  let errEl = field.nextElementSibling;
  if (errEl?.classList.contains('form-error')) {
    errEl.textContent = valid ? '' : errorMsg;
  }

  return valid;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;

  // Check honeypot
  const honeypot = form.querySelector('.form-honeypot input');
  if (honeypot?.value) return; // Spam detected

  // Validate all required fields
  const fields = form.querySelectorAll('[required]');
  let allValid = true;
  fields.forEach(field => {
    if (!validateField(field)) allValid = false;
  });

  if (!allValid) return;

  // Update button state
  const submitBtn = form.querySelector('[type="submit"]');
  const originalText = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = I18n.t('contact.sending');
  }

  const successMsg = form.querySelector('.form-success');
  const errorMsg = form.querySelector('.form-error-msg');
  if (successMsg) successMsg.style.display = 'none';
  if (errorMsg) errorMsg.style.display = 'none';

  try {
    // Using Formspree (replace ACTION_URL with actual Formspree endpoint)
    const formData = new FormData(form);
    const action = form.getAttribute('action') || 'https://formspree.io/f/REPLACE_WITH_ID';

    const response = await fetch(action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      if (successMsg) {
        successMsg.textContent = I18n.t('contact.success');
        successMsg.style.display = 'block';
      }
      form.reset();
    } else {
      throw new Error('Form submission failed');
    }
  } catch (err) {
    if (errorMsg) {
      errorMsg.textContent = I18n.t('contact.error');
      errorMsg.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

/* ── Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80; // header height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
