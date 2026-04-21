/**
 * FieldsMotors Agricole - Products & Catalog Logic
 * Filtering, comparison, product detail rendering
 */

const Products = (() => {
  let allProducts = [];
  let filteredProducts = [];
  let compareList = [];
  const MAX_COMPARE = 3;

  // Load products from JSON
  async function loadProducts() {
    try {
      const res = await fetch('/data/products.json');
      allProducts = await res.json();
      return allProducts;
    } catch (e) {
      console.error('Failed to load products:', e);
      return [];
    }
  }

  // Filter products by HP and drive
  function filter({ hp = 'all', drive = 'all' } = {}) {
    filteredProducts = allProducts.filter(p => {
      const matchHp = hp === 'all' || matchHpRange(p.hp, hp);
      const matchDrive = drive === 'all' || p.drive === drive;
      return matchHp && matchDrive;
    });
    return filteredProducts;
  }

  // Match HP range string like "45-47" or exact "26"
  function matchHpRange(productHp, rangeStr) {
    if (rangeStr.includes('-')) {
      const [min, max] = rangeStr.split('-').map(Number);
      return productHp >= min && productHp <= max;
    }
    return productHp === parseInt(rangeStr, 10);
  }

  // Get featured products
  function getFeatured() {
    return allProducts.filter(p => p.featured);
  }

  // Get product by ID
  function getById(id) {
    return allProducts.find(p => p.id === id);
  }

  // Render a product card (v2 — TAFE-inspired + Moroccan touch)
  function renderCard(product, lang = 'fr') {
    const hpLabel = lang === 'ar' ? 'حصان' : lang === 'en' ? 'HP' : 'CV';
    const driveDisplay = product.drive === '4WD'
      ? (lang === 'fr' ? '4RM' : lang === 'ar' ? 'دفع رباعي' : '4WD')
      : (lang === 'fr' ? '2RM' : lang === 'ar' ? 'دفع ثنائي' : '2WD');
    const compareLabel = lang === 'ar' ? 'مقارنة' : lang === 'en' ? 'Compare' : 'Comparer';
    const detailLabel  = lang === 'ar' ? 'مشاهدة التفاصيل' : lang === 'en' ? 'View Details' : 'Voir Détails';
    const quoteLabel   = lang === 'ar' ? 'طلب عرض سعر' : lang === 'en' ? 'Request Quote' : 'Devis';
    const subsidyLabel = lang === 'ar' ? 'دعم FDA' : lang === 'en' ? 'FDA Subsidy' : 'Subvention FDA';

    // Category display — uppercase, short label
    const catMap = { compact: 'COMPACT', classic: 'CLASSIC', magna: 'MAGNA', polyvalent: 'POLYVALENT', orchard: 'VERGER', heritage: 'HERITAGE', puissant: 'PUISSANT', premium: 'PREMIUM' };
    const catLabel = catMap[(product.category || '').toLowerCase()] || (product.category || '').toUpperCase() || 'TAFE';

    const inCompare = compareList.includes(product.id);

    // Zellige 8-pointed star watermark (two squares rotated 45°, very low opacity)
    const zelligeStar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" style="position:absolute;width:120px;height:120px;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.10;pointer-events:none;z-index:0;"><polygon points="50,4 56,18 72,10 64,26 80,32 66,40 80,48 64,54 72,70 56,62 50,96 44,62 28,70 36,54 20,48 34,40 20,32 36,26 28,10 44,18" fill="none" stroke="%23C9952A" stroke-width="1.5"/><polygon points="50,22 70,50 50,78 30,50" fill="none" stroke="%23006233" stroke-width="1"/><circle cx="50" cy="50" r="3" fill="%23C9952A"/></svg>`;

    const subsidyHtml = product.subsidy_eligible ? `
      <div class="pc-subsidy">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        ${subsidyLabel} — 30%
      </div>` : '';

    return `
      <article class="product-card-v2 reveal" data-product-id="${product.id}" data-hp="${product.hp}" data-drive="${product.drive}">
        <div class="pc-top">
          <span class="pc-hp-badge">${product.hp} ${hpLabel}</span>
          <span class="pc-cat-badge" data-cat="${(product.category||'').toLowerCase()}">${catLabel}</span>
        </div>
        <div class="pc-image">
          ${zelligeStar}
          <img
            src="${product.image}"
            alt="${product.brand} ${product.model}"
            loading="lazy"
            onerror="this.src='';this.alt='${product.brand} ${product.model}';"
          />
        </div>
        <div class="pc-info">
          <h3 class="pc-model">${product.brand} ${product.model}</h3>
          <div class="pc-drive-row">
            <span class="pc-drive-badge">${product.drive}</span>
            <span class="pc-drive-badge">${driveDisplay}</span>
          </div>
          ${subsidyHtml}
          <div class="pc-actions">
            <a href="/product-detail.html?id=${product.id}" class="btn btn-primary btn-sm">${detailLabel}</a>
            <a href="/contact.html?subject=quote&model=${product.id}" class="btn btn-outline btn-sm">${quoteLabel}</a>
          </div>
          <button
            class="btn btn-sm pc-compare-btn ${inCompare ? 'btn-dark' : 'btn-outline'} compare-toggle"
            data-compare-id="${product.id}"
            onclick="Products.toggleCompare('${product.id}')"
          >
            ${inCompare ? '✓ ' : ''}${compareLabel}
          </button>
        </div>
      </article>
    `;
  }

  // ── Family / variant grouping ─────────────────────────────────────────────

  // Strip drive suffix from product ID to get family key
  function getFamilyKey(id) {
    return id.replace(/-[24]wd$/, '');
  }

  // Group an array of products into families.
  // Returns array of arrays: each inner array = 1 product (solo) or 2 products (variants).
  function groupByFamily(products) {
    const map = new Map();
    products.forEach(p => {
      const key = getFamilyKey(p.id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    // Sort variants: 2WD first, 4WD second
    map.forEach(arr => arr.sort((a, b) => (a.drive === '2WD' ? -1 : 1)));
    return [...map.values()];
  }

  // Render a family card — either a solo card or a 2RM/4RM grouped card
  function renderFamilyCard(variants, lang = 'fr', activeDrive = 'all') {
    if (variants.length === 1) return renderCard(variants[0], lang);

    // Determine which variant to show by default
    let activeIdx = 0; // default: first (2WD)
    if (activeDrive === '4WD') activeIdx = 1;

    const active   = variants[activeIdx];
    const inactive = variants[1 - activeIdx];

    const hpLabel   = lang === 'ar' ? 'حصان' : lang === 'en' ? 'HP' : 'CV';
    const detailLabel = lang === 'ar' ? 'مشاهدة التفاصيل' : lang === 'en' ? 'View Details' : 'Voir Détails';
    const quoteLabel  = lang === 'ar' ? 'طلب عرض سعر'     : lang === 'en' ? 'Request Quote'  : 'Devis';
    const compareLabel= lang === 'ar' ? 'مقارنة'            : lang === 'en' ? 'Compare'         : 'Comparer';
    const subsidyLabel= lang === 'ar' ? 'دعم FDA'           : lang === 'en' ? 'FDA Subsidy'     : 'Subvention FDA';
    const label2wd = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('common.2wd') : (lang === 'ar' ? 'دفع ثنائي' : lang === 'en' ? '2WD' : '2RM');
    const label4wd = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('common.4wd') : (lang === 'ar' ? 'دفع رباعي' : lang === 'en' ? '4WD' : '4RM');

    const catMap  = { compact:'COMPACT', classic:'CLASSIC', magna:'MAGNA' };
    const catLabel= catMap[(active.category||'').toLowerCase()] || (active.category||'').toUpperCase() || 'TAFE';

    // Base model name: strip trailing drive tokens
    const baseModel = active.model.replace(/\s+(2WD|4WD|PD\s*4WD|PD)$/i, '').replace(/\s+(4RM|2RM)$/i, '').trim();

    const familyKey = getFamilyKey(active.id);

    const zelligeStar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" style="position:absolute;width:120px;height:120px;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.10;pointer-events:none;z-index:0;"><polygon points="50,4 56,18 72,10 64,26 80,32 66,40 80,48 64,54 72,70 56,62 50,96 44,62 28,70 36,54 20,48 34,40 20,32 36,26 28,10 44,18" fill="none" stroke="%23C9952A" stroke-width="1.5"/><polygon points="50,22 70,50 50,78 30,50" fill="none" stroke="%23006233" stroke-width="1"/><circle cx="50" cy="50" r="3" fill="%23C9952A"/></svg>`;

    const subsidyHtml = active.subsidy_eligible ? `
      <div class="pc-subsidy">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        ${subsidyLabel} — 30%
      </div>` : '';

    return `
      <article class="product-card-v2 reveal product-family-card"
        data-family="${familyKey}"
        data-active-variant="${active.id}"
        data-2wd-id="${variants.find(v=>v.drive==='2WD')?.id||''}"
        data-4wd-id="${variants.find(v=>v.drive==='4WD')?.id||''}"
        data-hp="${active.hp}"
        data-drive="${active.drive}"
        data-product-id="${active.id}">
        <div class="pc-top">
          <span class="pc-hp-badge">${active.hp} ${hpLabel}</span>
          <span class="pc-cat-badge" data-cat="${(active.category||'').toLowerCase()}">${catLabel}</span>
        </div>
        <div class="pc-image">
          ${zelligeStar}
          <img
            class="family-card-img"
            src="${active.image}"
            data-img-2wd="${variants.find(v=>v.drive==='2WD')?.image||active.image}"
            data-img-4wd="${variants.find(v=>v.drive==='4WD')?.image||active.image}"
            alt="${active.brand} ${baseModel}"
            loading="lazy"
            onerror="this.src='';this.alt='${active.brand} ${baseModel}';"
          />
        </div>
        <div class="pc-info">
          <h3 class="pc-model">${active.brand} ${baseModel}</h3>
          <div class="variant-toggle" role="group" aria-label="Choisir la transmission">
            <button class="variant-btn ${variants[0].drive==='2WD' && activeIdx===0 ? 'active' : (variants[0].drive==='4WD' && activeIdx===1 ? 'active' : '')}"
              data-drive="${variants[0].drive}"
              onclick="switchFamilyVariant(this)">
              ${variants[0].drive==='2WD' ? label2wd : label4wd}
            </button>
            <button class="variant-btn ${variants[1].drive==='4WD' && activeIdx===1 ? 'active' : (variants[1].drive==='2WD' && activeIdx===0 ? 'active' : '')}"
              data-drive="${variants[1].drive}"
              onclick="switchFamilyVariant(this)">
              ${variants[1].drive==='4WD' ? label4wd : label2wd}
            </button>
          </div>
          ${subsidyHtml}
          <div class="pc-actions">
            <a href="/product-detail.html?id=${active.id}" class="btn btn-primary btn-sm family-detail-link">${detailLabel}</a>
            <a href="/contact.html?subject=quote&model=${active.id}" class="btn btn-outline btn-sm family-quote-link">${quoteLabel}</a>
          </div>
          <button
            class="btn btn-sm pc-compare-btn btn-outline compare-toggle"
            data-compare-id="${active.id}"
            onclick="Products.toggleCompare('${active.id}')"
          >${compareLabel}</button>
        </div>
      </article>
    `;
  }

  function subsidyBadge(lang) {
    const title = lang === 'ar' ? 'برنامج دعم FDA' : lang === 'en' ? 'FDA Subsidy Program' : 'Programme de Subvention FDA';
    const text = lang === 'ar' ? 'حتى 30% من السعر مدعوم' : lang === 'en' ? 'up to 30% covered' : 'jusqu\'à 30% pris en charge';
    return `
      <div class="subsidy-callout">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="subsidy-callout-text"><span>${title}</span> – ${text}</div>
      </div>
    `;
  }

  function productIconSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>`;
  }

  // Compare functionality
  function toggleCompare(id) {
    const idx = compareList.indexOf(id);
    if (idx === -1) {
      if (compareList.length >= MAX_COMPARE) {
        alert(I18n.t('products.compare_select'));
        return;
      }
      compareList.push(id);
    } else {
      compareList.splice(idx, 1);
    }
    updateCompareUI();
    // Update button state
    document.querySelectorAll(`[data-compare-id="${id}"]`).forEach(btn => {
      const inList = compareList.includes(id);
      btn.classList.toggle('btn-dark', inList);
      btn.classList.toggle('btn-outline', !inList);
      btn.textContent = inList
        ? '✓ ' + (I18n.t('products.compare') || 'Comparer')
        : (I18n.t('products.compare') || 'Comparer');
    });
  }

  function updateCompareUI() {
    const bar = document.getElementById('compare-bar');
    const itemsContainer = document.getElementById('compare-items');
    const compareBtn = document.getElementById('compare-btn');

    if (!bar) return;

    bar.classList.toggle('visible', compareList.length >= 2);

    if (itemsContainer) {
      itemsContainer.innerHTML = compareList.map(id => {
        const p = getById(id);
        if (!p) return '';
        return `
          <div class="compare-item">
            <span>${p.model}</span>
            <span class="badge badge-hp">${p.hp}</span>
            <button class="compare-item-remove" onclick="Products.toggleCompare('${id}')" aria-label="Remove">✕</button>
          </div>
        `;
      }).join('');
    }

    if (compareBtn) {
      compareBtn.href = `/compare.html?models=${compareList.join(',')}`;
    }
  }

  function getCompareList() { return [...compareList]; }

  // Render product detail page
  function renderDetail(productId, lang = 'fr') {
    const product = getById(productId);
    if (!product) return null;

    const t = product.translations[lang] || product.translations['fr'];
    const strings = I18n.section('products');

    return `
      <div class="product-detail">
        <div class="product-detail-grid">
          <div class="product-detail-images">
            <div class="product-detail-main-image">
              <img src="${product.image}" alt="${product.brand} ${product.model}" />
            </div>
          </div>
          <div class="product-detail-info">
            <div class="product-card-brand">${product.brand}</div>
            <h1>${product.model}</h1>
            <div class="product-badges" style="display:flex;gap:8px;margin:12px 0;">
              <span class="badge badge-hp">${product.hp} ${strings.hp_badge || 'CV'}</span>
              <span class="badge ${product.drive === '4WD' ? 'badge-4wd' : 'badge-2wd'}">${product.drive}</span>
            </div>
            <p style="color:var(--color-text-secondary);line-height:1.7;margin-bottom:24px;">${t.description}</p>
            ${product.subsidy_eligible ? subsidyBadge(lang) : ''}
            <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap;">
              <a href="/contact.html?subject=quote&model=${product.id}" class="btn btn-primary btn-lg">${strings.request_quote || 'Demander un Devis'}</a>
              <a href="tel:+212677184906" class="btn btn-outline btn-lg">+212 677 184 906</a>
            </div>
          </div>
        </div>

        <div class="product-specs-section" style="margin-top:64px;">
          <h2>${strings.specs_title || 'Spécifications Techniques'}</h2>
          <div class="specs-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;margin-top:32px;">
            ${renderSpecCard(strings.engine || 'Moteur', [
              ['Make', product.engine.make],
              ['Type', product.engine.type],
              ['Cylindres', product.engine.cylinders],
              ['Cylindrée', product.engine.cc + ' cc'],
              ['Injection', product.engine.fuel_injection],
              ['Filtre air', product.engine.air_cleaner],
              ['Capacité carburant', product.engine.fuel_capacity],
            ])}
            ${renderSpecCard(strings.transmission || 'Transmission', [
              ['Embrayage', product.transmission.clutch],
              ['Boîte de vitesses', product.transmission.gearbox],
              ['Pont arrière', product.transmission.rear_axle],
            ])}
            ${renderSpecCard(strings.hydraulics || 'Hydraulique', [
              ['Débit pompe', product.hydraulics.pump_lpm + ' L/min'],
              ['Pompe additionnelle', product.hydraulics.aux_pump],
            ])}
            ${renderSpecCard(strings.pto || 'PTO', [
              ['PTO', product.pto],
            ])}
            ${renderSpecCard(strings.steering || 'Direction', [
              ['Direction', product.steering],
            ])}
            ${renderSpecCard(strings.brakes || 'Freins', [
              ['Freins', product.brakes],
            ])}
            ${renderSpecCard(strings.tyres || 'Pneumatiques', [
              ['Avant', product.tyres.front],
              ['Arrière', product.tyres.rear],
            ])}
          </div>

          ${product.standard_features.length ? `
            <div style="margin-top:40px;">
              <h3>${strings.standard_features || 'Équipements Standard'}</h3>
              <ul style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;">
                ${product.standard_features.map(f => `
                  <li style="display:flex;align-items:center;gap:8px;font-size:0.9rem;">
                    <span style="color:var(--color-success);font-size:1.1rem;">✓</span> ${f}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          ${product.optional_features.length ? `
            <div style="margin-top:32px;">
              <h3>${strings.optional_features || 'Options Disponibles'}</h3>
              <ul style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;">
                ${product.optional_features.map(f => `
                  <li style="display:flex;align-items:center;gap:8px;font-size:0.9rem;">
                    <span style="color:var(--color-orange);font-size:1.1rem;">+</span> ${f}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderSpecCard(title, rows) {
    return `
      <div style="background:var(--color-white);border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-sm);">
        <div style="background:var(--color-black);padding:12px 16px;">
          <h4 style="color:var(--color-white);font-size:0.95rem;margin:0;">${title}</h4>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${rows.map(([key, val]) => `
            <tr style="border-bottom:1px solid var(--color-border);">
              <td style="padding:10px 16px;font-size:0.85rem;color:var(--color-text-secondary);font-weight:600;width:45%;">${key}</td>
              <td style="padding:10px 16px;font-size:0.85rem;color:var(--color-text);">${val}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  // Render comparison table
  function renderCompareTable(ids, lang = 'fr') {
    const products = ids.map(id => getById(id)).filter(Boolean);
    if (!products.length) return '';

    const fields = [
      { key: 'hp', label: { fr: 'Puissance', ar: 'القدرة', en: 'Power' } },
      { key: 'drive', label: { fr: 'Transmission', ar: 'نوع الدفع', en: 'Drive' } },
      { key: 'engine.make', label: { fr: 'Moteur', ar: 'المحرك', en: 'Engine' } },
      { key: 'engine.cylinders', label: { fr: 'Cylindres', ar: 'الأسطوانات', en: 'Cylinders' } },
      { key: 'engine.cc', label: { fr: 'Cylindrée', ar: 'سعة المحرك', en: 'Displacement' } },
      { key: 'transmission.gearbox', label: { fr: 'Boîte de vitesses', ar: 'ناقل الحركة', en: 'Gearbox' } },
      { key: 'hydraulics.pump_lpm', label: { fr: 'Hydraulique', ar: 'الهيدروليك', en: 'Hydraulics' } },
      { key: 'pto', label: { fr: 'PTO', ar: 'PTO', en: 'PTO' } },
      { key: 'tyres.rear', label: { fr: 'Pneus arrière', ar: 'الإطارات الخلفية', en: 'Rear tyres' } },
      { key: 'subsidy_eligible', label: { fr: 'Subvention FDA', ar: 'دعم FDA', en: 'FDA Subsidy' } },
    ];

    const getNestedVal = (obj, path) => {
      return path.split('.').reduce((acc, part) => acc?.[part], obj);
    };

    return `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:500px;">
          <thead>
            <tr style="background:var(--color-black);">
              <th style="padding:16px;text-align:left;color:var(--color-grey);font-size:0.85rem;width:160px;">Spécification</th>
              ${products.map(p => `
                <th style="padding:16px;text-align:center;color:var(--color-white);font-family:var(--font-heading);">
                  ${p.model}
                  <div style="display:flex;gap:6px;justify-content:center;margin-top:6px;">
                    <span class="badge badge-hp">${p.hp} CV</span>
                    <span class="badge ${p.drive === '4WD' ? 'badge-4wd' : 'badge-2wd'}">${p.drive}</span>
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${fields.map((field, idx) => `
              <tr style="background:${idx % 2 === 0 ? 'var(--color-white)' : 'var(--color-grey-light)'};">
                <td style="padding:14px 16px;font-size:0.85rem;font-weight:600;color:var(--color-text-secondary);">${field.label[lang] || field.label.fr}</td>
                ${products.map(p => {
                  let val = getNestedVal(p, field.key);
                  if (field.key === 'subsidy_eligible') {
                    val = val ? '<span style="color:var(--color-success);">✓ Éligible</span>' : '–';
                  } else if (field.key === 'engine.cc') {
                    val = val + ' cc';
                  } else if (field.key === 'hydraulics.pump_lpm') {
                    val = val + ' L/min';
                  } else if (field.key === 'hp') {
                    val = val + ' CV';
                  }
                  return `<td style="padding:14px 16px;text-align:center;font-size:0.9rem;">${val || '–'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return {
    loadProducts,
    filter,
    getFeatured,
    getById,
    renderCard,
    renderFamilyCard,
    groupByFamily,
    renderDetail,
    renderCompareTable,
    toggleCompare,
    getCompareList,
    get all() { return allProducts; }
  };
})();

window.Products = Products;

/* ── Product Catalog Page Logic ── */
async function initCatalogPage() {
  const grid = document.getElementById('products-grid');
  const noResults = document.getElementById('no-results');
  if (!grid) return;

  await Products.loadProducts();

  // Determine HP range of all products
  const allHps = Products.all.map(p => p.hp).filter(Boolean);
  const minHp = allHps.length ? Math.min(...allHps) : 20;
  const maxHp = allHps.length ? Math.max(...allHps) : 100;

  let currentHpMax = maxHp; // slider = show products up to this HP
  let currentDrive = 'all';
  let currentCategory = 'all';

  // Wire up HP slider
  const hpSlider = document.getElementById('hp-slider');
  const hpDisplay = document.getElementById('hp-value-display');

  if (hpSlider) {
    hpSlider.min = minHp;
    hpSlider.max = maxHp;
    hpSlider.value = maxHp;
    if (hpDisplay) hpDisplay.textContent = `≤ ${maxHp} ${hpDisplay.dataset.unit || 'CV'}`;

    hpSlider.addEventListener('input', () => {
      currentHpMax = parseInt(hpSlider.value, 10);
      if (hpDisplay) hpDisplay.textContent = `≤ ${currentHpMax} ${hpDisplay.dataset.unit || 'CV'}`;
      render();
    });
  }

  // Wire up drive toggle buttons (v2 style)
  document.querySelectorAll('.filter-drive-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-drive-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDrive = btn.getAttribute('data-filter-drive');
      render();
    });
  });

  // Fallback: legacy [data-filter-drive] pills if present
  document.querySelectorAll('[data-filter-drive]:not(.filter-drive-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-drive]:not(.filter-drive-btn)').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDrive = btn.getAttribute('data-filter-drive');
      render();
    });
  });

  // Category tab buttons
  const catBtns = document.querySelectorAll('.filter-cat-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter-cat');
      render();
    });
  });

  // Legacy category dropdown (kept for backwards compat, hidden if tabs present)
  const catSelect = document.getElementById('category-select');
  if (catSelect && !catBtns.length) {
    const categories = [...new Set(Products.all.map(p => p.category).filter(Boolean))];
    const allLabel = catSelect.dataset.allLabel || 'Toutes les catégories';
    catSelect.innerHTML = `<option value="all">${allLabel}</option>` +
      categories.map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('');
    catSelect.addEventListener('change', () => {
      currentCategory = catSelect.value;
      render();
    });
  }

  // Fallback: legacy [data-filter-hp] pills (HP bucket buttons)
  document.querySelectorAll('[data-filter-hp]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-hp]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Legacy HP filter sets slider to max when "all" is selected
      const val = btn.getAttribute('data-filter-hp');
      if (val === 'all') {
        currentHpMax = maxHp;
        if (hpSlider) { hpSlider.value = maxHp; }
        if (hpDisplay) hpDisplay.textContent = `≤ ${maxHp} CV`;
      }
      render();
    });
  });

  function render() {
    // Use slider-based HP max filter; show all products with hp <= currentHpMax
    const results = Products.all.filter(p => {
      const matchHp = p.hp <= currentHpMax;
      const matchDrive = currentDrive === 'all' || p.drive === currentDrive;
      const matchCat = currentCategory === 'all' || p.category === currentCategory;
      return matchHp && matchDrive && matchCat;
    });

    const lang = (typeof I18n !== 'undefined' && I18n.getLang) ? I18n.getLang() : 'fr';

    if (!results.length) {
      grid.innerHTML = '';
      if (noResults) noResults.style.display = 'block';
      return;
    }

    if (noResults) noResults.style.display = 'none';
    // Group variants (45 DI 2WD + 4WD → one card with 2RM/4RM toggle)
    const groups = Products.groupByFamily(results);
    grid.innerHTML = groups.map(g => Products.renderFamilyCard(g, lang, currentDrive)).join('');

    // Re-init scroll reveal for new cards
    grid.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('visible');
    });
  }

  // Reset filters button
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentHpMax = maxHp;
      currentDrive = 'all';
      currentCategory = 'all';

      if (hpSlider) hpSlider.value = maxHp;
      if (hpDisplay) hpDisplay.textContent = `\u2264 ${maxHp} ${hpDisplay.dataset.unit || 'CV'}`;

      document.querySelectorAll('.filter-drive-btn').forEach(b => b.classList.remove('active'));
      const allDriveBtn = document.querySelector('.filter-drive-btn[data-filter-drive="all"]');
      if (allDriveBtn) allDriveBtn.classList.add('active');

      catBtns.forEach(b => b.classList.remove('active'));
      const allCatBtn = document.querySelector('.filter-cat-btn[data-filter-cat="all"]');
      if (allCatBtn) allCatBtn.classList.add('active');

      if (catSelect) catSelect.value = 'all';

      render();
    });
  }

  // Re-render on language change
  document.addEventListener('langchange', render);

  render();
}

/* ── Switch 2RM / 4RM variant on a grouped family card ── */
function switchFamilyVariant(btn) {
  const card = btn.closest('.product-family-card');
  if (!card) return;

  const selectedDrive = btn.dataset.drive; // '2WD' or '4WD'
  const targetId = selectedDrive === '2WD' ? card.dataset['2wdId'] : card.dataset['4wdId'];
  if (!targetId) return;

  const product = Products.getById(targetId);
  if (!product) return;

  // Update image
  const img = card.querySelector('.family-card-img');
  if (img) img.src = product.image;

  // Update detail/quote links
  const detailLink = card.querySelector('.family-detail-link');
  if (detailLink) detailLink.href = `/product-detail.html?id=${product.id}`;
  const quoteLink = card.querySelector('.family-quote-link');
  if (quoteLink) quoteLink.href = `/contact.html?subject=quote&model=${product.id}`;

  // Update compare button
  const cmpBtn = card.querySelector('.compare-toggle');
  if (cmpBtn) cmpBtn.dataset.compareId = product.id;

  // Update card data attribute
  card.dataset.activeVariant = product.id;
  card.dataset.drive = product.drive;

  // Toggle active state of variant buttons
  card.querySelectorAll('.variant-btn').forEach(b => {
    b.classList.toggle('active', b === btn);
  });
}

/* ── Featured Products (Home) ── */
async function initFeaturedProducts() {
  const grid = document.getElementById('featured-products');
  if (!grid) return;

  await Products.loadProducts();
  renderFeatured();

  document.addEventListener('langchange', renderFeatured);

  function renderFeatured() {
    const lang = I18n.getLang();
    const featured = Products.getFeatured().slice(0, 4);
    grid.innerHTML = featured.map(p => Products.renderCard(p, lang)).join('');
    grid.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

// Auto-init on catalog and home pages
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-grid')) initCatalogPage();
  if (document.getElementById('featured-products')) initFeaturedProducts();
});
