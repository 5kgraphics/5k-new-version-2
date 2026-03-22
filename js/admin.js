/**
 * 5K Digital Assets - Admin Panel JavaScript
 * Complete admin functionality
 */

// ===== Admin State =====
const adminState = {
  token: localStorage.getItem('adminToken'),
  currentSection: 'dashboard',
  products: [],
  messages: [],
  subscribers: [],
  adsConfig: {},
  quillEditor: null
};

// ===== Initialize Admin Panel =====
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!adminState.token) {
    window.location.href = 'admin-login.html';
    return;
  }

  // Initialize Quill editor
  initQuillEditor();

  // Setup navigation
  setupNavigation();
  
  // ATTACH EVENT LISTENERS (Fix for buttons not working)
  setupEventListeners();

  // Load initial data
  await Promise.all([
    loadDashboardStats(),
    loadProducts(),
    loadMessages(),
    loadSubscribers(),
    loadAdsConfig(),
    loadAdminProfile()
  ]);

  // Ensure dashboard section is visible
  showSection('dashboard');

  // Hide loading overlay
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('active');
});

// ===== Event Listeners Setup (NEW) =====
function setupEventListeners() {
    // Ads Save Button Fix
    const saveAdsBtn = document.getElementById('save-ads-config');
    if (saveAdsBtn) {
        saveAdsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveAdsConfig();
        });
    }

    // Password strength listener
    const newPasswordInput = document.getElementById('new-password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }
}

// ===== Quill Rich Text Editor =====
function initQuillEditor() {
  const editorElement = document.getElementById('product-description-editor');
  if (editorElement && typeof Quill !== 'undefined') {
    adminState.quillEditor = new Quill('#product-description-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'align': [] }],
          ['link', 'image'],
          ['clean']
        ]
      },
      placeholder: 'Write product description...'
    });
  }
}

// ===== Navigation =====
function setupNavigation() {
  const navLinks = document.querySelectorAll('.admin-nav-link[data-section]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      showSection(section);
    });
  });

  // Handle hash navigation
  const hash = window.location.hash.replace('#', '');
  if (hash && ['dashboard', 'products', 'messages', 'newsletter', 'ads', 'settings'].includes(hash)) {
    showSection(hash);
  }
}

function showSection(section) {
  // Update nav links
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-section') === section) {
      link.classList.add('active');
    }
  });

  // Hide all sections first
  document.querySelectorAll('.admin-section').forEach(s => {
    s.classList.remove('active');
  });
  
  // Show selected section
  const sectionEl = document.getElementById(`section-${section}`);
  if (sectionEl) {
    sectionEl.classList.add('active');
    // Force DOM reflow
    sectionEl.offsetHeight;
  }

  adminState.currentSection = section;
  window.location.hash = section;
  
  // Close mobile sidebar if open
  if (window.innerWidth <= 1024) {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  }
}

// ===== API Helper =====
async function adminFetch(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminState.token}`,
      ...options.headers
    }
  });

  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
    return;
  }

  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }

  return data;
}

// ===== Dashboard Stats =====
async function loadDashboardStats() {
  try {
    const data = await adminFetch('/admin/stats');
    if (data.success) {
      document.getElementById('stat-products').textContent = data.stats.totalProducts;
      document.getElementById('stat-downloads').textContent = data.stats.totalDownloads.toLocaleString();
      document.getElementById('stat-messages').textContent = data.stats.unreadMessages;
      document.getElementById('stat-subscribers').textContent = data.stats.totalSubscribers;

      // Update messages badge
      const badge = document.getElementById('messages-badge');
      if (badge) {
          if (data.stats.unreadMessages > 0) {
            badge.textContent = data.stats.unreadMessages;
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
      }
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// ===== Products Management =====
async function loadProducts() {
  try {
    const data = await adminFetch('/admin/products');
    if (data.success) {
      adminState.products = data.products;
      renderProductsTable(data.products);
    }
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found. Click "Add Product" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(product => `
    <tr>
      <td>
        <img src="${product.image || 'https://via.placeholder.com/60x40'}" alt="${product.title}" class="product-thumb">
      </td>
      <td><strong>${product.title}</strong></td>
      <td><span class="badge">${product.type || 'Digital'}</span></td>
      <td>${product.downloads?.toLocaleString() || 0}</td>
      <td>${product.views?.toLocaleString() || 0}</td>
      <td>${formatDate(product.createdAt)}</td>
      <td>
        <div class="actions-cell">
          <button class="action-btn" onclick="editProduct('${product.id}')" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn delete" onclick="deleteProduct('${product.id}')" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Product Modal Functions
function openProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');
  
  if (!modal || !form) return;

  form.reset();
  document.getElementById('product-id').value = '';
  
  if (adminState.quillEditor) {
    adminState.quillEditor.root.innerHTML = '';
  }

  if (productId) {
    title.textContent = 'Edit Product';
    const product = adminState.products.find(p => p.id === productId);
    if (product) {
      document.getElementById('product-id').value = product.id;
      document.getElementById('product-title').value = product.title;
      document.getElementById('product-image').value = product.image || '';
      document.getElementById('product-type').value = product.type || 'Digital';
      document.getElementById('product-size').value = product.size || '';
      document.getElementById('product-download-url').value = product.downloadUrl || '';
      
      if (adminState.quillEditor && product.description) {
        adminState.quillEditor.root.innerHTML = product.description;
      }
    }
  } else {
    title.textContent = 'Add Product';
  }

  modal.classList.add('show');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('show');
}

async function saveProduct(event) {
  event.preventDefault();
  
  const productId = document.getElementById('product-id').value;
  const productData = {
    title: document.getElementById('product-title').value,
    description: adminState.quillEditor ? adminState.quillEditor.root.innerHTML : '',
    image: document.getElementById('product-image').value,
    type: document.getElementById('product-type').value,
    size: document.getElementById('product-size').value,
    downloadUrl: document.getElementById('product-download-url').value
  };

  try {
    if (productId) {
      await adminFetch(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      showToast('Success', 'Product updated successfully');
    } else {
      await adminFetch('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      showToast('Success', 'Product created successfully');
    }

    closeProductModal();
    await loadProducts();
    await loadDashboardStats();
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

function editProduct(productId) {
  openProductModal(productId);
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    await adminFetch(`/admin/products/${productId}`, { method: 'DELETE' });
    showToast('Success', 'Product deleted');
    await loadProducts();
    await loadDashboardStats();
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

// ===== Messages Management =====
async function loadMessages() {
  try {
    const data = await adminFetch('/admin/messages');
    if (data.success) {
      adminState.messages = data.messages;
      renderMessages(data.messages);
    }
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

function renderMessages(messages) {
  const container = document.getElementById('messages-list');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = '<div class="text-center py-16"><p class="text-muted">No messages yet</p></div>';
    return;
  }

  container.innerHTML = messages.map(msg => `
    <div class="message-card ${msg.status === 'unread' ? 'unread' : ''}" onclick="viewMessage('${msg.id}')">
      <div class="message-header">
        <div>
          <div class="message-from">${msg.name}</div>
          <div class="message-email">${msg.email}</div>
        </div>
        <div class="message-date">${formatDate(msg.createdAt)}</div>
      </div>
      <div class="message-subject">${msg.subject || 'No Subject'}</div>
      <div class="message-preview">${msg.message}</div>
    </div>
  `).join('');
}

// FIXED: Added safety checks
function viewMessage(messageId) {
  const message = adminState.messages.find(m => m.id === messageId);
  if (!message) return;

  const content = document.getElementById('message-detail-content');
  const modal = document.getElementById('message-modal');
  const deleteBtn = document.getElementById('delete-message-btn');

  if (!content || !modal) return;

  content.innerHTML = `
    <div class="form-group">
      <label class="form-label">From</label>
      <p>${message.name} (${message.email})</p>
    </div>
    <div class="form-group">
      <label class="form-label">Subject</label>
      <p>${message.subject || 'No Subject'}</p>
    </div>
    <div class="form-group">
      <label class="form-label">Date</label>
      <p>${formatDate(message.createdAt)}</p>
    </div>
    <div class="form-group">
      <label class="form-label">Message</label>
      <div style="background: var(--input-bg); padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message.message}</div>
    </div>
  `;

  if (deleteBtn) {
      deleteBtn.onclick = () => deleteMessage(messageId);
  }
  
  modal.classList.add('show');

  // Mark as read
  markMessageAsRead(messageId);
}

function closeMessageModal() {
  const modal = document.getElementById('message-modal');
  if (modal) modal.classList.remove('show');
}

async function markMessageAsRead(messageId) {
  try {
    await adminFetch(`/admin/messages/${messageId}/read`, { method: 'PUT' });
    await loadDashboardStats();
  } catch (error) {
    console.error('Failed to mark message as read:', error);
  }
}

async function deleteMessage(messageId) {
  if (!confirm('Are you sure you want to delete this message?')) return;

  try {
    await adminFetch(`/admin/messages/${messageId}`, { method: 'DELETE' });
    showToast('Success', 'Message deleted');
    closeMessageModal();
    await loadMessages();
    await loadDashboardStats();
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

// ===== Newsletter Management =====
async function loadSubscribers() {
  try {
    const data = await adminFetch('/admin/newsletter');
    if (data.success) {
      adminState.subscribers = data.subscribers;
      renderSubscribersTable(data.subscribers);
    }
  } catch (error) {
    console.error('Failed to load subscribers:', error);
  }
}

function renderSubscribersTable(subscribers) {
  const tbody = document.getElementById('subscribers-table-body');
  if (!tbody) return;

  if (subscribers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">No subscribers yet</td></tr>';
    return;
  }

  tbody.innerHTML = subscribers.map(sub => `
    <tr>
      <td><strong>${sub.email}</strong></td>
      <td>${sub.source || 'Website'}</td>
      <td>${formatDate(sub.createdAt)}</td>
    </tr>
  `).join('');
}

async function exportSubscribers(format) {
  try {
    if (format === 'csv') {
      const response = await fetch(`${API_BASE}/admin/newsletter/export`, {
        headers: { 'Authorization': `Bearer ${adminState.token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const subscribers = adminState.subscribers;
      let csv = 'Email,Source,Subscribed At\n';
      subscribers.forEach(sub => {
        csv += `"${sub.email}","${sub.source || 'Website'}","${sub.createdAt}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Success', 'Subscribers exported successfully');
    }
  } catch (error) {
    showToast('Error', 'Failed to export subscribers', 'error');
  }
}

// ===== Ads Configuration =====
async function loadAdsConfig() {
  try {
    const data = await adminFetch('/admin/ads-config');
    if (data.success) {
      adminState.adsConfig = data.config || {};
      populateAdsForm(data.config || {});
    }
  } catch (error) {
    console.error('Failed to load ads config:', error);
  }
}

function populateAdsForm(config) {
  // Adsterra
  if (config.adsterra) {
    const check = (id, val) => { const el = document.getElementById(id); if(el) el.checked = val; };
    const val = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };

    check('adsterra-enabled', config.adsterra.enabled);
    if(config.adsterra.popunder) {
        check('adsterra-popunder-enabled', config.adsterra.popunder.enabled);
        val('adsterra-popunder-script', config.adsterra.popunder.script);
    }
    if(config.adsterra.banner) {
        check('adsterra-banner-enabled', config.adsterra.banner.enabled);
        val('adsterra-banner-script', config.adsterra.banner.script);
        val('adsterra-banner-position', config.adsterra.banner.position);
    }
    if(config.adsterra.native) {
        check('adsterra-native-enabled', config.adsterra.native.enabled);
        val('adsterra-native-script', config.adsterra.native.script);
    }
    if(config.adsterra.socialbar) {
        check('adsterra-socialbar-enabled', config.adsterra.socialbar.enabled);
        val('adsterra-socialbar-script', config.adsterra.socialbar.script);
    }
    if(config.adsterra.interstitial) {
        check('adsterra-interstitial-enabled', config.adsterra.interstitial.enabled);
        val('adsterra-interstitial-script', config.adsterra.interstitial.script);
    }
  }
  
  // Monetag
  if (config.monetag) {
    const check = (id, val) => { const el = document.getElementById(id); if(el) el.checked = val; };
    const val = (id, v) => { const el = document.getElementById(id); if(el) el.value = v; };

    check('monetag-enabled', config.monetag.enabled);
    val('monetag-publisher-id', config.monetag.publisherId);
     if(config.monetag.popunder) {
        check('monetag-popunder-enabled', config.monetag.popunder.enabled);
        val('monetag-popunder-zone', config.monetag.popunder.zoneId);
    }
    if(config.monetag.native) {
        check('monetag-native-enabled', config.monetag.native.enabled);
        val('monetag-native-zone', config.monetag.native.zoneId);
    }
    if(config.monetag.banner) {
        check('monetag-banner-enabled', config.monetag.banner.enabled);
        val('monetag-banner-zone', config.monetag.banner.zoneId);
        val('monetag-banner-position', config.monetag.banner.position);
    }
    if(config.monetag.interstitial) {
        check('monetag-interstitial-enabled', config.monetag.interstitial.enabled);
        val('monetag-interstitial-zone', config.monetag.interstitial.zoneId);
    }
    if(config.monetag.smartlink) {
        check('monetag-smartlink-enabled', config.monetag.smartlink.enabled);
        val('monetag-smartlink-zone', config.monetag.smartlink.zoneId);
    }
  }
  
  // Google AdSense
  if (config.adsense) {
    const check = (id, val) => { const el = document.getElementById(id); if(el) el.checked = val; };
    const val = (id, v) => { const el = document.getElementById(id); if(el) el.value = v; };

    check('adsense-enabled', config.adsense.enabled);
    val('adsense-publisher-id', config.adsense.publisherId);
    if(config.adsense.autoAds) check('adsense-autoads-enabled', config.adsense.autoAds.enabled);
    if(config.adsense.displayAds) {
        check('adsense-display-enabled', config.adsense.displayAds.enabled);
        if(config.adsense.displayAds.slots) {
            val('adsense-slot-header', config.adsense.displayAds.slots.header);
            val('adsense-slot-sidebar', config.adsense.displayAds.slots.sidebar);
            val('adsense-slot-incontent', config.adsense.displayAds.slots.inContent);
            val('adsense-slot-footer', config.adsense.displayAds.slots.footer);
        }
    }
    if(config.adsense.inArticle) {
        check('adsense-inarticle-enabled', config.adsense.inArticle.enabled);
        val('adsense-inarticle-slot', config.adsense.inArticle.slotId);
    }
  }
  
  // Timer
  const timerEnabled = document.getElementById('timer-enabled');
  const timerDuration = document.getElementById('timer-duration');
  if(timerEnabled) timerEnabled.checked = config.timer?.enabled !== false;
  if(timerDuration) timerDuration.value = config.timer?.duration || 10;
}

async function saveAdsConfig() {
  const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const getCheck = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

  const config = {
    adsterra: {
      enabled: getCheck('adsterra-enabled'),
      popunder: {
        enabled: getCheck('adsterra-popunder-enabled'),
        script: getVal('adsterra-popunder-script')
      },
      banner: {
        enabled: getCheck('adsterra-banner-enabled'),
        script: getVal('adsterra-banner-script'),
        position: getVal('adsterra-banner-position')
      },
      native: {
        enabled: getCheck('adsterra-native-enabled'),
        script: getVal('adsterra-native-script')
      },
      socialbar: {
        enabled: getCheck('adsterra-socialbar-enabled'),
        script: getVal('adsterra-socialbar-script')
      },
      interstitial: {
        enabled: getCheck('adsterra-interstitial-enabled'),
        script: getVal('adsterra-interstitial-script')
      }
    },
    monetag: {
      enabled: getCheck('monetag-enabled'),
      publisherId: getVal('monetag-publisher-id'),
      popunder: {
        enabled: getCheck('monetag-popunder-enabled'),
        zoneId: getVal('monetag-popunder-zone')
      },
      native: {
        enabled: getCheck('monetag-native-enabled'),
        zoneId: getVal('monetag-native-zone')
      },
      banner: {
        enabled: getCheck('monetag-banner-enabled'),
        zoneId: getVal('monetag-banner-zone'),
        position: getVal('monetag-banner-position')
      },
      interstitial: {
        enabled: getCheck('monetag-interstitial-enabled'),
        zoneId: getVal('monetag-interstitial-zone')
      },
      smartlink: {
        enabled: getCheck('monetag-smartlink-enabled'),
        zoneId: getVal('monetag-smartlink-zone')
      }
    },
    adsense: {
      enabled: getCheck('adsense-enabled'),
      publisherId: getVal('adsense-publisher-id'),
      autoAds: {
        enabled: getCheck('adsense-autoads-enabled')
      },
      displayAds: {
        enabled: getCheck('adsense-display-enabled'),
        slots: {
          header: getVal('adsense-slot-header'),
          sidebar: getVal('adsense-slot-sidebar'),
          inContent: getVal('adsense-slot-incontent'),
          footer: getVal('adsense-slot-footer')
        }
      },
      inArticle: {
        enabled: getCheck('adsense-inarticle-enabled'),
        slotId: getVal('adsense-inarticle-slot')
      }
    },
    timer: {
      enabled: getCheck('timer-enabled'),
      duration: parseInt(getVal('timer-duration')) || 10
    }
  };

  try {
    await adminFetch('/admin/ads-config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    adminState.adsConfig = config;
    showToast('Success', 'Ads configuration saved successfully');
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

// Ads Tab Switching
function showAdsTab(tabName) {
  document.querySelectorAll('.ads-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.textContent.toLowerCase().includes(tabName)) {
      tab.classList.add('active');
    }
  });
  
  document.querySelectorAll('.ads-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const activeContent = document.getElementById(`ads-tab-${tabName}`);
  if (activeContent) {
    activeContent.classList.add('active');
  }
}

window.showAdsTab = showAdsTab;

// ===== Admin Profile & Settings =====
async function loadAdminProfile() {
  try {
    const data = await adminFetch('/admin/profile');
    if (data.success) {
        const nameEl = document.getElementById('admin-name');
        if(nameEl) nameEl.textContent = data.admin.name;
        
        const nameInput = document.getElementById('admin-name-input');
        if(nameInput) nameInput.value = data.admin.name;
        
        const emailInput = document.getElementById('admin-email');
        if(emailInput) emailInput.value = data.admin.email;
        
        const lastLogin = document.getElementById('last-login');
        if(lastLogin) lastLogin.textContent = formatDate(data.admin.lastLogin);
        
        const loginAttempts = document.getElementById('login-attempts');
        if(loginAttempts) loginAttempts.textContent = data.admin.loginAttempts || 0;
        
        const pwChanged = document.getElementById('password-changed');
        if(pwChanged) pwChanged.textContent = formatDate(data.admin.passwordChanged);

      if (data.admin.recoveryQuestions) {
        const q1 = document.getElementById('recovery-q1');
        if(q1) q1.value = data.admin.recoveryQuestions.q1 || '';
        const a1 = document.getElementById('recovery-a1');
        if(a1) a1.value = data.admin.recoveryQuestions.a1 || '';
        // ... repeat for other questions if needed
      }
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

async function updateProfile(event) {
  event.preventDefault();
  const nameInput = document.getElementById('admin-name-input');
  if(!nameInput) return;
  
  const name = nameInput.value;

  try {
    await adminFetch('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    const nameEl = document.getElementById('admin-name');
    if(nameEl) nameEl.textContent = name;
    showToast('Success', 'Profile updated successfully');
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

async function changePassword(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById('current-password')?.value;
  const newPassword = document.getElementById('new-password')?.value;
  const confirmPassword = document.getElementById('confirm-password')?.value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('Error', 'All fields are required', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('Error', 'Passwords do not match', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showToast('Error', 'Password must be at least 8 characters', 'error');
    return;
  }

  try {
    await adminFetch('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    showToast('Success', 'Password changed successfully');
    const form = document.getElementById('password-form');
    if(form) form.reset();
    updatePasswordStrength('');
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

function updatePasswordStrength(password) {
  const strengthEl = document.getElementById('password-strength');
  if (!strengthEl) return;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  strengthEl.className = 'password-strength';
  const textEl = strengthEl.querySelector('.strength-text');
  
  if (strength <= 2) {
    strengthEl.classList.add('weak');
    if(textEl) textEl.textContent = 'Weak password';
  } else if (strength <= 3) {
    strengthEl.classList.add('medium');
    if(textEl) textEl.textContent = 'Medium password';
  } else {
    strengthEl.classList.add('strong');
    if(textEl) textEl.textContent = 'Strong password';
  }
}

async function updateRecoveryQuestions(event) {
  event.preventDefault();
  
  const questions = {
    q1: document.getElementById('recovery-q1')?.value,
    a1: document.getElementById('recovery-a1')?.value,
    q2: document.getElementById('recovery-q2')?.value,
    a2: document.getElementById('recovery-a2')?.value,
    q3: document.getElementById('recovery-q3')?.value,
    a3: document.getElementById('recovery-a3')?.value
  };

  if (!questions.q1 || !questions.a1 || !questions.q2 || !questions.a2 || !questions.q3 || !questions.a3) {
    showToast('Error', 'All questions and answers are required', 'error');
    return;
  }

  try {
    await adminFetch('/admin/recovery-questions', {
      method: 'POST',
      body: JSON.stringify(questions)
    });
    showToast('Success', 'Recovery questions saved successfully');
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

// ===== Logout =====
async function adminLogout() {
  try {
    await adminFetch('/admin/logout', { method: 'POST' });
  } catch (error) {
    // Ignore
  }
  localStorage.removeItem('adminToken');
  window.location.href = 'admin-login.html';
}

// ===== Utility Functions =====
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

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
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Make functions globally available for HTML onclick handlers
window.showSection = showSection;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.loadMessages = loadMessages;
window.viewMessage = viewMessage;
window.closeMessageModal = closeMessageModal;
window.deleteMessage = deleteMessage;
window.exportSubscribers = exportSubscribers;
window.saveAdsConfig = saveAdsConfig;
window.updateProfile = updateProfile;
window.changePassword = changePassword;
window.updatePasswordStrength = updatePasswordStrength;
window.updateRecoveryQuestions = updateRecoveryQuestions;
window.adminLogout = adminLogout;
