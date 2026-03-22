/**
 * 5K Digital Assets - Frontend JavaScript
 * For Cloudflare Pages deployment
 */

// ===== Configuration =====
// UPDATE THIS to your Cloudflare Worker URL
const API_BASE = 'https://5k-digital-assets-api.nurayusuf398.workers.dev/api';

const CONFIG = {
  toastDuration: 3000,
  loadingDuration: 2500,
  itemsPerPage: 12,
  flutterwavePublicKey: 'FLWPUBK-XXXXXXXXXXXXXXXXXXXXXXXXXX-X' // Replace with your public key
};

// ===== State Management =====
const state = {
  products: [],
  currentPage: 1,
  searchQuery: '',
  selectedType: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  isDark: false,
  isMobileMenuOpen: false,
  selectedDonationTier: null,
  adminToken: localStorage.getItem('adminToken'),
  config: null,
  adsSessionId: null,
  currentProduct: null
};

// ===== Utility Functions =====
const Utils = {
  async fetchAPI(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API Error');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      // Handle SQLite datetime format and ISO format
      let date;
      if (typeof dateString === 'string') {
        // Try parsing SQLite format: YYYY-MM-DD HH:MM:SS
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
          date = new Date(dateString.replace(' ', 'T') + 'Z');
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime()) || date.toString() === 'Invalid Date') {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'N/A';
    }
  },

  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').substring(0, 150);
  }
};

// ===== Toast Notifications =====
function showToast(title, description, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-description">${description}</div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, CONFIG.toastDuration);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ===== Loading Animation =====
function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('active');
    createLoadingEffects();
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

function createLoadingEffects() {
  const binaryContainer = document.getElementById('loading-binary');
  if (binaryContainer) {
    binaryContainer.innerHTML = '';
    for (let i = 0; i < 50; i++) {
      const span = document.createElement('span');
      span.className = 'binary-char';
      span.textContent = Math.random() > 0.5 ? '0' : '1';
      span.style.left = `${Math.random() * 100}%`;
      span.style.animationDelay = `${i * 0.08}s`;
      binaryContainer.appendChild(span);
    }
  }
  
  const particlesContainer = document.getElementById('loading-particles');
  if (particlesContainer) {
    particlesContainer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${i * 0.15}s`;
      particlesContainer.appendChild(particle);
    }
  }
}

// ===== Theme Management =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  state.isDark = savedTheme === 'dark';
  applyTheme();
}

function applyTheme() {
  const root = document.documentElement;
  
  if (state.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
  updateThemeToggleUI();
}

function toggleTheme() {
  state.isDark = !state.isDark;
  applyTheme();
}

function updateThemeToggleUI() {
  const label = document.querySelector('.theme-toggle-label');
  if (label) {
    label.textContent = state.isDark ? 'Dark' : 'Light';
  }
}

// ===== Mobile Menu =====
function toggleMobileMenu() {
  state.isMobileMenuOpen = !state.isMobileMenuOpen;
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  
  if (menu) menu.classList.toggle('open', state.isMobileMenuOpen);
  if (overlay) overlay.classList.toggle('open', state.isMobileMenuOpen);
}

function closeMobileMenu() {
  state.isMobileMenuOpen = false;
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  
  if (menu) menu.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ===== Back to Top Button =====
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== Products =====
async function loadProducts() {
  try {
    const params = new URLSearchParams({
      page: state.currentPage,
      limit: CONFIG.itemsPerPage,
      search: state.searchQuery,
      type: state.selectedType,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder
    });

    const data = await Utils.fetchAPI(`/products?${params}`);
    state.products = data.products;
    renderProducts(data.products, data.pagination);
  } catch (error) {
    showToast('Error', 'Failed to load products', 'error');
  }
}

function renderProducts(products, pagination) {
  const container = document.getElementById('products-grid');
  const infoEl = document.getElementById('products-info');
  const paginationEl = document.getElementById('pagination');
  
  if (!container) return;

  if (infoEl) {
    let infoText = `Showing ${products.length} of ${pagination.total} products`;
    if (state.selectedType !== 'all') infoText += ` in ${state.selectedType}`;
    if (state.searchQuery) infoText += ` matching "${state.searchQuery}"`;
    infoEl.textContent = infoText;
  }

  if (products.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16" style="grid-column: 1/-1;">
        <p class="text-lg text-muted mb-4">No products found</p>
        <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
      </div>
    `;
  } else {
    container.innerHTML = products.map(product => createProductCard(product)).join('');
  }

  if (paginationEl && pagination.totalPages > 1) {
    renderPagination(pagination);
  } else if (paginationEl) {
    paginationEl.innerHTML = '';
  }
}

function createProductCard(product) {
  const typeClass = getTypeClass(product.type);
  return `
    <a href="product.html?id=${product.id}" class="product-card">
      <div class="gradient-border-effect"></div>
      <div class="product-image">
        <img src="${product.image}" alt="${product.title}" loading="lazy">
        <div class="product-badges">
          <span class="badge ${typeClass}">${product.type}</span>
          ${product.size ? `<span class="badge" style="margin-left:auto;background:var(--background);backdrop-filter:blur(4px);">${product.size}</span>` : ''}
        </div>
      </div>
      <div class="product-content">
        <h3 class="product-title">${product.title}</h3>
        <p class="product-description">${Utils.stripHtml(product.description)}</p>
        <div class="product-stats">
          <span class="product-stat">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            ${product.views?.toLocaleString() || 0}
          </span>
          <span class="product-stat">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            ${product.downloads?.toLocaleString() || 0}
          </span>
        </div>
      </div>
    </a>
  `;
}

function getTypeClass(type) {
  const typeMap = {
    'Audio': 'badge-audio', 'Brush': 'badge-brush', 'Course': 'badge-course',
    'Ebook': 'badge-ebook', 'Font': 'badge-font', 'Preset': 'badge-preset',
    'Template': 'badge-template', 'Texture': 'badge-texture', 'UI-Kit': 'badge-ui-kit',
    'Softwares': 'badge-softwares', 'Management System': 'badge-management',
    'AI': 'badge-ai', 'Videos': 'badge-videos', 'Kids': 'badge-kids'
  };
  return typeMap[type] || '';
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!container) return;

  const pages = [];
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (i === 1 || i === pagination.totalPages || (i >= pagination.page - 1 && i <= pagination.page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  container.innerHTML = `
    <button class="pagination-btn" ${pagination.page === 1 ? 'disabled' : ''} onclick="changePage(${pagination.page - 1})">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    ${pages.map(p => p === '...' 
      ? '<span class="pagination-btn" style="border:none;">...</span>'
      : `<button class="pagination-btn ${p === pagination.page ? 'active' : ''}" onclick="changePage(${p})">${p}</button>`
    ).join('')}
    <button class="pagination-btn" ${pagination.page === pagination.totalPages ? 'disabled' : ''} onclick="changePage(${pagination.page + 1})">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  `;
}

function changePage(page) {
  state.currentPage = page;
  loadProducts();
  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
}

function handleSearch(event) {
  event.preventDefault();
  const input = document.getElementById('search-input');
  state.searchQuery = input?.value || '';
  state.currentPage = 1;
  loadProducts();
}

function handleTypeChange(type) {
  state.selectedType = type;
  state.currentPage = 1;
  const select = document.getElementById('type-select');
  if (select) select.value = type;
  loadProducts();
}

function handleSortChange(value) {
  const [sortBy, sortOrder] = value.split('-');
  state.sortBy = sortBy;
  state.sortOrder = sortOrder;
  state.currentPage = 1;
  loadProducts();
}

function clearFilters() {
  state.searchQuery = '';
  state.selectedType = 'all';
  state.currentPage = 1;
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  
  const typeSelect = document.getElementById('type-select');
  if (typeSelect) typeSelect.value = 'all';
  
  loadProducts();
}

// ===== Product Detail =====
async function loadProductDetail() {
  const productId = Utils.getQueryParam('id');
  
  if (!productId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const data = await Utils.fetchAPI(`/products/${productId}`);
    const product = data.product;
    state.currentProduct = product;
    renderProductDetail(product);
  } catch (error) {
    document.getElementById('product-detail').innerHTML = `
      <div class="text-center py-16">
        <h1 class="text-2xl font-bold mb-4">Product Not Found</h1>
        <a href="index.html" class="btn btn-primary">Back to Home</a>
      </div>
    `;
  }
}

function renderProductDetail(product) {
  const typeClass = getTypeClass(product.type);
  const container = document.getElementById('product-detail');
  
  if (!container) return;
  
  // Update page title
  document.title = `${product.title || 'Product'} - 5K Digital Assets`;

  // Safe values with fallbacks - handle null, undefined, and empty values
  const views = (product.views != null && !isNaN(product.views)) ? product.views.toLocaleString() : '0';
  const downloads = (product.downloads != null && !isNaN(product.downloads)) ? product.downloads.toLocaleString() : '0';
  const description = product.description || '<p class="text-muted">No description available.</p>';
  const size = product.size || '';
  const createdAt = Utils.formatDate(product.createdAt) || 'N/A';
  const productType = product.type || 'Digital';
  const productTitle = product.title || 'Untitled Product';
  const productImage = product.image || 'https://via.placeholder.com/600x400';

  container.innerHTML = `
    <div class="product-detail-grid">
      <div class="product-detail-image">
        <img src="${productImage}" alt="${productTitle}">
        <div class="product-detail-stats">
          <span class="badge" style="background:var(--background);backdrop-filter:blur(4px);">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            ${views} views
          </span>
          <span class="badge" style="background:var(--background);backdrop-filter:blur(4px);">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            ${downloads} downloads
          </span>
        </div>
      </div>
      
      <div class="product-detail-info">
        <span class="badge ${typeClass} mb-2">${productType}</span>
        <h1>${productTitle}</h1>
        <div class="product-detail-meta">
          ${size ? `<span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            ${size}
          </span>` : ''}
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            Added ${createdAt}
          </span>
        </div>
        
        <div class="card product-description-card">
          <div class="card-content">
            <h2 class="text-lg font-semibold mb-4">Description</h2>
            <div style="line-height:1.7;">${description}</div>
          </div>
        </div>
        
        <div class="product-detail-actions mt-4">
          <button class="btn btn-primary btn-lg" onclick="startDownload('${product.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Download Now
          </button>
          <button class="btn btn-outline btn-lg" onclick="shareProduct()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
            Share
          </button>
        </div>
        
        <div class="buy-coffee-section">
          <p class="text-muted text-sm mb-3">Found this useful? Support the creator!</p>
          <a href="support.html" class="buy-coffee-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21V7h3.66l.84-4.18A1 1 0 0 0 7.5 2h9a1 1 0 0 0 .97-.76L18.34 2H20a1 1 0 0 0 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm2-1h16V4h-1.34l-.84 4.18A1 1 0 0 1 16.5 9h-9a1 1 0 0 0-.97.76L6.16 13H4zm2.16-7h9.68l.5-2.5H5.66l.5 2.5z"/></svg>
            Buy Me a Coffee
          </a>
        </div>
      </div>
    </div>
  `;
}

// ===== Download with Ads Timer =====
async function startDownload(productId) {
  try {
    const data = await Utils.fetchAPI('/download/request', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });

    state.adsSessionId = data.sessionId;
    showAdsModal(data.timerDuration || 10);
  } catch (error) {
    showToast('Error', 'Failed to start download', 'error');
  }
}

function showAdsModal(duration) {
  const modal = document.getElementById('ads-modal');
  if (!modal) return;
  
  modal.classList.add('show');
  startAdsTimer(duration);
}

function startAdsTimer(duration) {
  let remaining = duration;
  const timerText = document.getElementById('ads-timer-text');
  const progress = document.querySelector('.ads-timer-progress');
  const circumference = 2 * Math.PI * 45;

  const interval = setInterval(async () => {
    remaining--;
    
    if (timerText) timerText.textContent = remaining;
    
    if (progress) {
      const offset = circumference * (1 - remaining / duration);
      progress.style.strokeDashoffset = offset;
    }

    if (remaining <= 0) {
      clearInterval(interval);
      await completeDownload();
    }
  }, 1000);
}

async function completeDownload() {
  if (!state.adsSessionId || !state.currentProduct) {
    showToast('Error', 'No active download session', 'error');
    return;
  }

  try {
    const data = await Utils.fetchAPI('/download/complete', {
      method: 'POST',
      body: JSON.stringify({ 
        sessionId: state.adsSessionId,
        productId: state.currentProduct.id 
      })
    });

    const modal = document.getElementById('ads-modal');
    if (modal) modal.classList.remove('show');

    if (data.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
      showToast('Download Started', 'Your download should begin shortly.');
    }
  } catch (error) {
    showToast('Error', error.message || 'Failed to complete download', 'error');
  }
}

// ===== Share Product =====
function shareProduct() {
  const url = window.location.href;
  const title = document.title;
  
  if (navigator.share) {
    navigator.share({
      title: title,
      url: url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link Copied', 'Product link copied to clipboard');
    });
  }
}

// ===== Newsletter =====
async function subscribeNewsletter(email, source = 'popup') {
  try {
    const data = await Utils.fetchAPI('/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email, source })
    });

    if (data.exists) {
      showToast('Already Subscribed', 'This email is already subscribed to our newsletter.');
    } else {
      showToast('Subscribed!', 'Thank you for subscribing to our newsletter.');
    }
    return data;
  } catch (error) {
    showToast('Error', 'Failed to subscribe', 'error');
  }
}

function handleNewsletterSubmit(event, source = 'footer') {
  event.preventDefault();
  const form = event.target;
  const emailInput = form.querySelector('input[type="email"]');
  const email = emailInput?.value;
  
  if (!email || !email.includes('@')) {
    showToast('Invalid Email', 'Please enter a valid email address.', 'error');
    return;
  }
  
  subscribeNewsletter(email, source);
  if (emailInput) emailInput.value = '';
}

// ===== Cookie Consent =====
function checkCookieConsent() {
  const consent = localStorage.getItem('cookie-consent');
  if (!consent) {
    setTimeout(() => {
      const banner = document.getElementById('cookie-consent');
      if (banner) banner.classList.add('show');
    }, 1000);
  }
}

function acceptCookies() {
  localStorage.setItem('cookie-consent', 'accepted');
  const banner = document.getElementById('cookie-consent');
  if (banner) banner.classList.remove('show');
}

function declineCookies() {
  localStorage.setItem('cookie-consent', 'declined');
  const banner = document.getElementById('cookie-consent');
  if (banner) banner.classList.remove('show');
}

// ===== Accordion =====
function toggleAccordion(itemId) {
  const trigger = document.querySelector(`[data-accordion="${itemId}"]`);
  const content = document.getElementById(`accordion-content-${itemId}`);
  
  if (trigger && content) {
    const isOpen = trigger.classList.contains('open');
    
    document.querySelectorAll('.faq-trigger').forEach(t => t.classList.remove('open'));
    document.querySelectorAll('.faq-content').forEach(c => c.classList.remove('open'));
    
    if (!isOpen) {
      trigger.classList.add('open');
      content.classList.add('open');
    }
  }
}

// ===== Contact Form =====
async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  try {
    await Utils.fetchAPI('/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
      })
    });
    
    showToast('Message Sent', 'Thank you for contacting us!');
    form.reset();
  } catch (error) {
    showToast('Error', 'Failed to send message', 'error');
  }
}

// ===== Donation with Flutterwave =====
function selectDonationTier(tierId) {
  state.selectedDonationTier = tierId;
  
  document.querySelectorAll('.donation-tier').forEach(el => {
    el.style.borderColor = 'var(--card-border)';
    el.style.background = 'var(--card)';
  });
  
  const tier = document.getElementById(`tier-${tierId}`);
  if (tier) {
    tier.style.borderColor = 'var(--primary)';
    tier.style.background = 'var(--primary-light)';
  }
  
  const customInput = document.getElementById('custom-amount');
  if (customInput) customInput.value = '';
}

async function handleDonation() {
  let amount;
  
  // Get amount from tier or custom input
  if (state.selectedDonationTier) {
    const tiers = { 'coffee': 5, 'lunch': 15, 'premium': 50, 'sponsor': 100 };
    amount = tiers[state.selectedDonationTier];
  } else {
    const customInput = document.getElementById('custom-amount');
    amount = parseFloat(customInput?.value);
  }
  
  // Validate amount
  if (!amount || amount < 1) {
    showToast('Invalid Amount', 'Please select a tier or enter a valid amount', 'error');
    return;
  }
  
  // Get customer details
  const customerName = document.getElementById('customerName')?.value?.trim();
  const customerEmail = document.getElementById('customerEmail')?.value?.trim();
  
  // Validate customer details - REQUIRED for Flutterwave
  if (!customerEmail || !customerEmail.includes('@')) {
    showToast('Email Required', 'Please enter a valid email address', 'error');
    document.getElementById('customerEmail')?.focus();
    return;
  }
  
  if (!customerName || customerName.length < 2) {
    showToast('Name Required', 'Please enter your name', 'error');
    document.getElementById('customerName')?.focus();
    return;
  }
  
  // Check if Flutterwave is loaded
  if (typeof FlutterwaveCheckout === 'undefined') {
    showToast('Payment Error', 'Payment system is loading. Please try again.', 'error');
    return;
  }
  
  // Generate transaction reference
  const txRef = '5k-donation-' + Date.now();
  
  // Initialize Flutterwave payment
  FlutterwaveCheckout({
    public_key: CONFIG.flutterwavePublicKey,
    tx_ref: txRef,
    amount: amount,
    currency: 'USD',
    payment_options: 'card,usd',
    customer: {
      email: customerEmail,
      name: customerName
    },
    customizations: {
      title: '5K Digital Assets',
      description: 'Support Donation',
      logo: window.location.origin + '/images/logo.png'
    },
    callback: function(response) {
      if (response.status === 'successful') {
        // Redirect to success page
        window.location.href = 'support.html?payment=success';
      }
    },
    onclose: function() {
      // Handle modal close
    }
  });
}

// ===== Load Config with Ads =====
async function loadConfig() {
  try {
    state.config = await Utils.fetchAPI('/config');
    if (state.config?.flutterwavePublicKey) {
      CONFIG.flutterwavePublicKey = state.config.flutterwavePublicKey;
    }
    
    // Initialize ads if configured
    if (state.config?.ads) {
      initializeAds(state.config.ads);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// ===== Server-Side Ads Injection =====
function initializeAds(adsConfig) {
  if (!adsConfig) return;
  
  // Initialize Adsterra ads
  if (adsConfig.adsterra?.enabled) {
    // Popunder
    if (adsConfig.adsterra.popunder?.enabled && adsConfig.adsterra.popunder?.script) {
      injectScript(adsConfig.adsterra.popunder.script, true);
    }
    
    // Banner
    if (adsConfig.adsterra.banner?.enabled && adsConfig.adsterra.banner?.script) {
      const position = adsConfig.adsterra.banner.position || 'bottom';
      if (position === 'top' || position === 'both') {
        injectBannerAd(adsConfig.adsterra.banner.script, 'top');
      }
      if (position === 'bottom' || position === 'both') {
        injectBannerAd(adsConfig.adsterra.banner.script, 'bottom');
      }
    }
    
    // Native
    if (adsConfig.adsterra.native?.enabled && adsConfig.adsterra.native?.script) {
      injectScript(adsConfig.adsterra.native.script, true);
    }
    
    // Social Bar
    if (adsConfig.adsterra.socialbar?.enabled && adsConfig.adsterra.socialbar?.script) {
      injectScript(adsConfig.adsterra.socialbar.script, true);
    }
    
    // Interstitial
    if (adsConfig.adsterra.interstitial?.enabled && adsConfig.adsterra.interstitial?.script) {
      injectScript(adsConfig.adsterra.interstitial.script, true);
    }
  }
  
  // Initialize Monetag ads
  if (adsConfig.monetag?.enabled && adsConfig.monetag?.publisherId) {
    const pubId = adsConfig.monetag.publisherId;
    
    // Popunder
    if (adsConfig.monetag.popunder?.enabled && adsConfig.monetag.popunder?.zoneId) {
      injectMonetagAd(pubId, adsConfig.monetag.popunder.zoneId, 'popunder');
    }
    
    // Native
    if (adsConfig.monetag.native?.enabled && adsConfig.monetag.native?.zoneId) {
      injectMonetagAd(pubId, adsConfig.monetag.native.zoneId, 'native');
    }
    
    // Banner
    if (adsConfig.monetag.banner?.enabled && adsConfig.monetag.banner?.zoneId) {
      const position = adsConfig.monetag.banner.position || 'bottom';
      injectMonetagBanner(pubId, adsConfig.monetag.banner.zoneId, position);
    }
    
    // Interstitial
    if (adsConfig.monetag.interstitial?.enabled && adsConfig.monetag.interstitial?.zoneId) {
      injectMonetagAd(pubId, adsConfig.monetag.interstitial.zoneId, 'interstitial');
    }
    
    // Smartlink
    if (adsConfig.monetag.smartlink?.enabled && adsConfig.monetag.smartlink?.zoneId) {
      injectMonetagSmartlink(pubId, adsConfig.monetag.smartlink.zoneId);
    }
  }
  
  // Initialize Google AdSense
  if (adsConfig.adsense?.enabled && adsConfig.adsense?.publisherId) {
    const pubId = adsConfig.adsense.publisherId;
    
    // Load AdSense script
    injectAdSenseScript(pubId);
    
    // Auto Ads
    if (adsConfig.adsense.autoAds?.enabled) {
      // Auto ads are automatically handled by the AdSense script
    }
    
    // Display Ads
    if (adsConfig.adsense.displayAds?.enabled) {
      const slots = adsConfig.adsense.displayAds.slots || {};
      if (slots.header) injectAdSenseDisplay(pubId, slots.header, 'header');
      if (slots.sidebar) injectAdSenseDisplay(pubId, slots.sidebar, 'sidebar');
      if (slots.inContent) injectAdSenseDisplay(pubId, slots.inContent, 'in-content');
      if (slots.footer) injectAdSenseDisplay(pubId, slots.footer, 'footer');
    }
    
    // In-Article Ads
    if (adsConfig.adsense.inArticle?.enabled && adsConfig.adsense.inArticle?.slotId) {
      injectAdSenseInArticle(pubId, adsConfig.adsense.inArticle.slotId);
    }
  }
  
  // Store timer config for download
  if (adsConfig.timer) {
    CONFIG.timerConfig = adsConfig.timer;
  }
}

function injectScript(src, async = true) {
  if (!src || src.trim() === '') return;
  
  const script = document.createElement('script');
  script.src = src;
  script.async = async;
  script.setAttribute('data-cfasync', 'false');
  document.body.appendChild(script);
}

// Monetag ad injection
function injectMonetagAd(publisherId, zoneId, format) {
  const script = document.createElement('script');
  script.src = `https://dynamic-an.com/${format}.js?p=${publisherId}&z=${zoneId}`;
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  document.body.appendChild(script);
}

function injectMonetagBanner(publisherId, zoneId, position) {
  const container = document.createElement('div');
  container.id = `monetag-banner-${position}`;
  container.className = 'banner-ad-container';
  container.style.cssText = 'display:flex;justify-content:center;padding:10px 0;';
  
  if (position === 'top') {
    document.body.insertBefore(container, document.body.firstChild);
  } else {
    document.body.appendChild(container);
  }
  
  const script = document.createElement('script');
  script.src = `https://dynamic-an.com/banner.js?p=${publisherId}&z=${zoneId}`;
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  container.appendChild(script);
}

function injectMonetagSmartlink(publisherId, zoneId) {
  const script = document.createElement('script');
  script.src = `https://dynamic-an.com/smartlink.js?p=${publisherId}&z=${zoneId}`;
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  document.body.appendChild(script);
}

// Google AdSense injection
function injectAdSenseScript(publisherId) {
  // Check if already loaded
  if (document.querySelector('script[src*="adsbygoogle"]')) return;
  
  const script = document.createElement('script');
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

function injectAdSenseDisplay(publisherId, slotId, position) {
  const container = document.createElement('div');
  container.id = `adsense-${position}`;
  container.style.cssText = 'display:flex;justify-content:center;padding:10px 0;';
  
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.setAttribute('data-ad-client', publisherId);
  ins.setAttribute('data-ad-slot', slotId);
  ins.setAttribute('data-ad-format', 'auto');
  ins.setAttribute('data-full-width-responsive', 'true');
  
  container.appendChild(ins);
  
  // Insert at appropriate position
  if (position === 'header') {
    const main = document.querySelector('main') || document.body;
    main.insertBefore(container, main.firstChild);
  } else if (position === 'footer') {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.parentNode.insertBefore(container, footer);
    } else {
      document.body.appendChild(container);
    }
  } else if (position === 'sidebar') {
    // Create or find sidebar
    let sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
      sidebar = document.createElement('div');
      sidebar.className = 'sidebar';
      document.body.appendChild(sidebar);
    }
    sidebar.appendChild(container);
  } else {
    // In-content - insert after main content
    const main = document.querySelector('main');
    if (main) {
      const productsSection = main.querySelector('.products-section');
      if (productsSection) {
        productsSection.parentNode.insertBefore(container, productsSection.nextSibling);
      }
    }
  }
  
  // Push to adsbygoogle array
  (window.adsbygoogle = window.adsbygoogle || []).push({});
}

function injectAdSenseInArticle(publisherId, slotId) {
  // Find content area and insert in-article ad
  const mainContent = document.querySelector('main .container');
  if (!mainContent) return;
  
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.style.textAlign = 'center';
  ins.setAttribute('data-ad-layout', 'in-article');
  ins.setAttribute('data-ad-format', 'fluid');
  ins.setAttribute('data-ad-client', publisherId);
  ins.setAttribute('data-ad-slot', slotId);
  
  const container = document.createElement('div');
  container.className = 'adsense-in-article';
  container.style.cssText = 'margin: 20px 0;';
  container.appendChild(ins);
  
  // Insert after first section
  const firstSection = mainContent.querySelector('section');
  if (firstSection) {
    firstSection.parentNode.insertBefore(container, firstSection.nextSibling);
  }
  
  (window.adsbygoogle = window.adsbygoogle || []).push({});
}

function injectBannerAd(scriptSrc, position) {
  if (!scriptSrc || scriptSrc.trim() === '') return;
  
  const container = document.createElement('div');
  container.id = `banner-ad-${position}`;
  container.className = 'banner-ad-container';
  container.style.cssText = `
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 10px;
    background: var(--card);
    border-${position === 'top' ? 'bottom' : 'top'}: 1px solid var(--card-border);
    z-index: 100;
  `;
  
  if (position === 'top') {
    const header = document.querySelector('.header');
    if (header) {
      header.after(container);
    }
  } else {
    const footer = document.querySelector('.footer');
    if (footer) {
      footer.before(container);
    } else {
      document.body.appendChild(container);
    }
  }
  
  const script = document.createElement('script');
  script.src = scriptSrc;
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  container.appendChild(script);
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
  const overlay = document.getElementById('mobile-menu-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
  }

  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }
  });
}

// ===== Page Initialization =====
async function initPage() {
  initTheme();
  checkCookieConsent();
  setupEventListeners();
  initBackToTop();
  await loadConfig();
  
  showLoading();
  setTimeout(hideLoading, CONFIG.loadingDuration);
  
  // Load products on home page
  if (document.getElementById('products-grid')) {
    await loadProducts();
  }
  
  // Load product detail on product page
  if (document.getElementById('product-detail')) {
    await loadProductDetail();
  }
}

document.addEventListener('DOMContentLoaded', initPage);
