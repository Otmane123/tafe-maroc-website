/**
 * FieldsMotors Agricole - i18n Translation Engine
 * Handles trilingual support: French (default), Arabic (RTL), English
 */

const I18n = (() => {
  let translations = {};
  let currentLang = 'fr';
  const STORAGE_KEY = 'fm_lang';
  const RTL_LANGS = ['ar'];

  // Load translations from JSON
  async function init() {
    try {
      const res = await fetch('/data/translations.json');
      translations = await res.json();
      const saved = localStorage.getItem(STORAGE_KEY) || 'fr';
      await setLang(saved, false);
    } catch (e) {
      console.error('i18n init error:', e);
    }
  }

  // Set active language
  async function setLang(lang, animate = true) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    // Update html attributes
    const html = document.documentElement;
    html.lang = lang;
    html.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

    // Load/unload RTL stylesheet
    const rtlLink = document.getElementById('rtl-stylesheet');
    if (RTL_LANGS.includes(lang)) {
      if (!rtlLink) {
        const link = document.createElement('link');
        link.id = 'rtl-stylesheet';
        link.rel = 'stylesheet';
        link.href = '/assets/css/rtl.css';
        document.head.appendChild(link);
      }
    } else {
      if (rtlLink) rtlLink.remove();
    }

    // Update all [data-i18n] elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = getKey(key);
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else if (el.tagName === 'OPTION') {
          el.textContent = text;
        } else {
          el.textContent = text;
        }
      }
    });

    // Update [data-i18n-html] for HTML content
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const text = getKey(key);
      if (text) el.innerHTML = text;
    });

    // Update [data-i18n-placeholder]
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = getKey(key);
      if (text) el.placeholder = text;
    });

    // Update [data-i18n-title]
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const text = getKey(key);
      if (text) el.title = text;
    });

    // Update lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update page title & meta if defined on page
    const titleKey = document.querySelector('[data-page-title]')?.getAttribute('data-page-title');
    if (titleKey) {
      const t = getKey(titleKey);
      if (t) document.title = t + ' | FieldsMotors Agricole';
    }

    // Dispatch event for page-specific scripts
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  // Get a nested key like "nav.home"
  function getKey(path) {
    const parts = path.split('.');
    let obj = translations[currentLang];
    for (const part of parts) {
      if (!obj) return null;
      obj = obj[part];
    }
    return typeof obj === 'string' ? obj : null;
  }

  // Get translation for current language
  function t(key) {
    return getKey(key) || key;
  }

  // Get all translations for a section
  function section(key) {
    const parts = key.split('.');
    let obj = translations[currentLang];
    for (const part of parts) {
      if (!obj) return {};
      obj = obj[part];
    }
    return obj || {};
  }

  // Get current lang
  function getLang() { return currentLang; }

  // Get all available languages
  function getLangs() { return Object.keys(translations); }

  return { init, setLang, t, section, getLang, getLangs };
})();

// Expose globally
window.I18n = I18n;
