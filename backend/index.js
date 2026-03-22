/**
 * 5K Digital Assets - Cloudflare Worker API
 * Complete backend with all features including:
 * - Single admin with recovery questions
 * - Enhanced security (salt + pepper)
 * - Ads management
 * - Newsletter export
 * - Cloudflare Turnstile verification
 */

// Turnstile Secret Key (Server-side)
const TURNSTILE_SECRET_KEY = '0x4AAAAAACuLdWXy4GUtXlWEz6gElpeeqRY';

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle OPTIONS request (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // ===== PUBLIC ROUTES =====
      
      // Config endpoint
      if (path === '/api/config' && request.method === 'GET') {
        return await handleGetConfig(request, env, corsHeaders);
      }

      // Products
      if (path === '/api/products' && request.method === 'GET') {
        return await handleGetProducts(request, env, corsHeaders);
      }

      // Single product
      if (path.match(/^\/api\/products\/[\w-]+$/) && request.method === 'GET') {
        return await handleGetProduct(request, env, corsHeaders);
      }

      // Download request (start timer)
      if (path === '/api/download/request' && request.method === 'POST') {
        return await handleDownloadRequest(request, env, corsHeaders);
      }

      // Download complete
      if (path === '/api/download/complete' && request.method === 'POST') {
        return await handleDownloadComplete(request, env, corsHeaders);
      }

      // Newsletter subscription
      if (path === '/api/newsletter' && request.method === 'POST') {
        return await handleNewsletter(request, env, corsHeaders);
      }

      // Contact form - now handled by formsubmit.co on frontend
      if (path === '/api/contact' && request.method === 'POST') {
        return await handleContact(request, env, corsHeaders);
      }

      // Flutterwave donation initialization
      if (path === '/api/flutterwave/donate' && request.method === 'POST') {
        return await handleFlutterwaveDonate(request, env, corsHeaders);
      }

      // Flutterwave payment verify
      if (path === '/api/flutterwave/verify' && request.method === 'POST') {
        return await handleFlutterwaveVerify(request, env, corsHeaders);
      }

      // Turnstile verification endpoint
      if (path === '/api/turnstile-verify' && request.method === 'POST') {
        return await handleTurnstileVerify(request, env, corsHeaders);
      }

      // Contact form verification endpoint
      if (path === '/api/contact-verify' && request.method === 'POST') {
        return await handleContactVerify(request, env, corsHeaders);
      }

      // ===== ADMIN ROUTES =====

      // Admin login
      if (path === '/api/admin/login' && request.method === 'POST') {
        return await handleAdminLogin(request, env, corsHeaders);
      }

      // Admin check setup
      if (path === '/api/admin/check-setup' && request.method === 'GET') {
        return await handleAdminCheckSetup(env, corsHeaders);
      }

      // Admin setup (create first admin)
      if (path === '/api/admin/setup' && request.method === 'POST') {
        return await handleAdminSetup(request, env, corsHeaders);
      }

      // Admin password recovery
      if (path === '/api/admin/recover' && request.method === 'POST') {
        return await handleAdminRecover(request, env, corsHeaders);
      }

      // Admin verify recovery
      if (path === '/api/admin/verify-recovery' && request.method === 'POST') {
        return await handleAdminVerifyRecovery(request, env, corsHeaders);
      }

      // Protected admin routes
      if (path.startsWith('/api/admin/')) {
        const authResult = await verifyAdminAuth(request, env);
        if (!authResult.valid) {
          return jsonResponse({ error: authResult.error }, corsHeaders, 401);
        }

        // Admin stats
        if (path === '/api/admin/stats' && request.method === 'GET') {
          return await handleAdminStats(env, corsHeaders);
        }

        // Admin profile
        if (path === '/api/admin/profile' && request.method === 'GET') {
          return await handleAdminGetProfile(env, authResult.adminId, corsHeaders);
        }
        if (path === '/api/admin/profile' && request.method === 'PUT') {
          return await handleAdminUpdateProfile(request, env, authResult.adminId, corsHeaders);
        }

        // Admin change password
        if (path === '/api/admin/change-password' && request.method === 'POST') {
          return await handleAdminChangePassword(request, env, authResult.adminId, corsHeaders);
        }

        // Admin recovery questions
        if (path === '/api/admin/recovery-questions' && request.method === 'POST') {
          return await handleAdminSetRecoveryQuestions(request, env, authResult.adminId, corsHeaders);
        }

        // Admin ads configuration
        if (path === '/api/admin/ads-config' && request.method === 'GET') {
          return await handleAdminGetAdsConfig(env, corsHeaders);
        }
        if (path === '/api/admin/ads-config' && request.method === 'POST') {
          return await handleAdminSetAdsConfig(request, env, corsHeaders);
        }

        // Admin products CRUD
        if (path === '/api/admin/products' && request.method === 'GET') {
          return await handleAdminGetProducts(env, corsHeaders);
        }
        if (path === '/api/admin/products' && request.method === 'POST') {
          return await handleAdminCreateProduct(request, env, corsHeaders);
        }
        if (path.match(/^\/api\/admin\/products\/[\w-]+$/) && request.method === 'PUT') {
          return await handleAdminUpdateProduct(request, env, corsHeaders);
        }
        if (path.match(/^\/api\/admin\/products\/[\w-]+$/) && request.method === 'DELETE') {
          return await handleAdminDeleteProduct(request, env, corsHeaders);
        }

        // Admin contact messages
        if (path === '/api/admin/messages' && request.method === 'GET') {
          return await handleAdminGetMessages(env, corsHeaders);
        }
        if (path.match(/^\/api\/admin\/messages\/[\w-]+$/) && request.method === 'DELETE') {
          return await handleAdminDeleteMessage(request, env, corsHeaders);
        }
        if (path.match(/^\/api\/admin\/messages\/[\w-]+\/read$/) && request.method === 'PUT') {
          return await handleAdminMarkMessageRead(request, env, corsHeaders);
        }

        // Admin newsletter
        if (path === '/api/admin/newsletter' && request.method === 'GET') {
          return await handleAdminGetNewsletter(env, corsHeaders);
        }
        if (path === '/api/admin/newsletter/export' && request.method === 'GET') {
          return await handleAdminExportNewsletter(env, corsHeaders);
        }

        // Admin logout
        if (path === '/api/admin/logout' && request.method === 'POST') {
          return await handleAdminLogout(request, env, corsHeaders);
        }

        return jsonResponse({ error: 'Admin route not found' }, corsHeaders, 404);
      }

      return jsonResponse({ error: 'Not found' }, corsHeaders, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ 
        error: 'Internal server error',
        message: error.message 
      }, corsHeaders, 500);
    }
  }
};

// ===== UTILITY FUNCTIONS =====

function jsonResponse(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

function generateId() {
  return crypto.randomUUID();
}

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Enhanced password hashing with salt and pepper
async function hashPassword(password, salt, pepper = '') {
  const encoder = new TextEncoder();
  // First hash with salt
  const data1 = encoder.encode(password + salt);
  const hashBuffer1 = await crypto.subtle.digest('SHA-256', data1);
  const hash1 = Array.from(new Uint8Array(hashBuffer1)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Second hash with pepper (server-side secret)
  const data2 = encoder.encode(hash1 + pepper);
  const hashBuffer2 = await crypto.subtle.digest('SHA-256', data2);
  return Array.from(new Uint8Array(hashBuffer2)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password with rate limiting
async function verifyPassword(password, storedHash, salt, pepper) {
  const computedHash = await hashPassword(password, salt, pepper);
  return computedHash === storedHash;
}

async function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'No token provided' };
  }

  const token = authHeader.substring(7);
  
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expiresAt > datetime("now")'
  ).bind(token).first();

  if (!session) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  return { valid: true, adminId: session.adminId };
}

// ===== TURNSTILE VERIFICATION =====

async function verifyTurnstile(token, ip = '') {
  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      return { success: true };
    }
    
    return { 
      success: false, 
      error: 'Verification failed',
      'error-codes': result['error-codes'] 
    };
  } catch (error) {
    return { success: false, error: 'Verification error' };
  }
}

async function handleTurnstileVerify(request, env, corsHeaders) {
  const { token } = await request.json();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  
  const result = await verifyTurnstile(token, ip);
  
  if (result.success) {
    return jsonResponse({ success: true, message: 'Verification successful' }, corsHeaders);
  }
  
  return jsonResponse({ 
    success: false, 
    error: result.error || 'Verification failed' 
  }, corsHeaders, 400);
}

async function handleContactVerify(request, env, corsHeaders) {
  const { name, email, subject, message, turnstileToken } = await request.json();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  
  // Verify Turnstile
  const turnstileResult = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileResult.success) {
    return jsonResponse({ 
      success: false, 
      error: 'Security verification failed' 
    }, corsHeaders, 400);
  }
  
  // Store message in database for admin to view
  try {
    await env.DB.prepare(
      'INSERT INTO contact_messages (id, name, email, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, "unread", datetime("now"))'
    ).bind(generateId(), name, email, subject || '', message).run();
  } catch (e) {
    console.error('Failed to save message:', e);
  }
  
  return jsonResponse({ success: true, message: 'Verification successful' }, corsHeaders);
}

// ===== CONFIG WITH ADS =====

async function handleGetConfig(request, env, corsHeaders) {
  // Get ads configuration
  let adsConfig = {};
  try {
    const adsResult = await env.DB.prepare(
      'SELECT config FROM ads_config WHERE id = "main"'
    ).first();
    if (adsResult?.config) {
      const fullConfig = JSON.parse(adsResult.config);
      
      // Build public-facing ads config (only what's needed client-side)
      adsConfig = {
        // Adsterra
        adsterra: {
          enabled: !!fullConfig.adsterra?.enabled,
          popunder: {
            enabled: !!fullConfig.adsterra?.popunder?.enabled,
            script: fullConfig.adsterra?.popunder?.script || ''
          },
          banner: {
            enabled: !!fullConfig.adsterra?.banner?.enabled,
            script: fullConfig.adsterra?.banner?.script || '',
            position: fullConfig.adsterra?.banner?.position || 'bottom'
          },
          native: {
            enabled: !!fullConfig.adsterra?.native?.enabled,
            script: fullConfig.adsterra?.native?.script || ''
          },
          socialbar: {
            enabled: !!fullConfig.adsterra?.socialbar?.enabled,
            script: fullConfig.adsterra?.socialbar?.script || ''
          },
          interstitial: {
            enabled: !!fullConfig.adsterra?.interstitial?.enabled,
            script: fullConfig.adsterra?.interstitial?.script || ''
          }
        },
        // Monetag
        monetag: {
          enabled: !!fullConfig.monetag?.enabled,
          publisherId: fullConfig.monetag?.publisherId || '',
          popunder: {
            enabled: !!fullConfig.monetag?.popunder?.enabled,
            zoneId: fullConfig.monetag?.popunder?.zoneId || ''
          },
          native: {
            enabled: !!fullConfig.monetag?.native?.enabled,
            zoneId: fullConfig.monetag?.native?.zoneId || ''
          },
          banner: {
            enabled: !!fullConfig.monetag?.banner?.enabled,
            zoneId: fullConfig.monetag?.banner?.zoneId || '',
            position: fullConfig.monetag?.banner?.position || 'bottom'
          },
          interstitial: {
            enabled: !!fullConfig.monetag?.interstitial?.enabled,
            zoneId: fullConfig.monetag?.interstitial?.zoneId || ''
          },
          smartlink: {
            enabled: !!fullConfig.monetag?.smartlink?.enabled,
            zoneId: fullConfig.monetag?.smartlink?.zoneId || ''
          }
        },
        // Google AdSense
        adsense: {
          enabled: !!fullConfig.adsense?.enabled,
          publisherId: fullConfig.adsense?.publisherId || '',
          autoAds: {
            enabled: !!fullConfig.adsense?.autoAds?.enabled
          },
          displayAds: {
            enabled: !!fullConfig.adsense?.displayAds?.enabled,
            slots: fullConfig.adsense?.displayAds?.slots || {}
          },
          inArticle: {
            enabled: !!fullConfig.adsense?.inArticle?.enabled,
            slotId: fullConfig.adsense?.inArticle?.slotId || ''
          }
        },
        // Timer
        timer: {
          enabled: fullConfig.timer?.enabled !== false,
          duration: fullConfig.timer?.duration || 10,
          showAd: !!fullConfig.timer?.showAd
        }
      };
    }
  } catch (e) {
    console.error('Error loading ads config:', e);
  }

  return jsonResponse({
    flutterwavePublicKey: env.FLUTTERWAVE_PUBLIC_KEY || '',
    siteName: '5K Digital Assets',
    siteUrl: env.SITE_URL || 'https://5kdigitalassets.com',
    ads: adsConfig
  }, corsHeaders);
}

// ===== PRODUCT HANDLERS =====

async function handleGetProducts(request, env, corsHeaders) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '12');
  const search = url.searchParams.get('search') || '';
  const type = url.searchParams.get('type') || 'all';
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';
  const offset = (page - 1) * limit;

  // Build query
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (search) {
    whereClause += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (type && type !== 'all') {
    whereClause += ' AND type = ?';
    params.push(type);
  }

  // Get total count
  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM products ${whereClause}`
  ).bind(...params).first();
  const total = countResult.total;

  // Get products
  const validSortColumns = ['createdAt', 'downloads', 'views', 'title'];
  const validSortOrders = ['asc', 'desc'];
  const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

  const products = await env.DB.prepare(
    `SELECT * FROM products ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return jsonResponse({
    success: true,
    products: products.results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }, corsHeaders);
}

async function handleGetProduct(request, env, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  const product = await env.DB.prepare(
    'SELECT * FROM products WHERE id = ?'
  ).bind(id).first();

  if (!product) {
    return jsonResponse({ error: 'Product not found' }, corsHeaders, 404);
  }

  // Increment views
  await env.DB.prepare(
    'UPDATE products SET views = views + 1 WHERE id = ?'
  ).bind(id).run();

  return jsonResponse({ success: true, product }, corsHeaders);
}

// ===== DOWNLOAD HANDLERS WITH ADS TIMER =====

async function handleDownloadRequest(request, env, corsHeaders) {
  const { productId } = await request.json();

  if (!productId) {
    return jsonResponse({ error: 'Product ID required' }, corsHeaders, 400);
  }

  // Check product exists
  const product = await env.DB.prepare(
    'SELECT * FROM products WHERE id = ?'
  ).bind(productId).first();

  if (!product) {
    return jsonResponse({ error: 'Product not found' }, corsHeaders, 404);
  }

  // Get timer duration from ads config
  let timerDuration = 10;
  try {
    const adsResult = await env.DB.prepare(
      'SELECT config FROM ads_config WHERE id = "main"'
    ).first();
    if (adsResult?.config) {
      const config = JSON.parse(adsResult.config);
      if (config.timer?.enabled !== false) {
        timerDuration = config.timer?.duration || 10;
      }
    }
  } catch (e) {}

  // Create session
  const sessionId = generateToken();
  const ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown';

  await env.DB.prepare(
    'INSERT INTO ads_sessions (id, sessionId, productId, ipAddress, createdAt) VALUES (?, ?, ?, ?, datetime("now"))'
  ).bind(generateId(), sessionId, productId, ipAddress).run();

  return jsonResponse({
    success: true,
    sessionId,
    timerDuration
  }, corsHeaders);
}

async function handleDownloadComplete(request, env, corsHeaders) {
  const { sessionId, productId } = await request.json();

  if (!sessionId || !productId) {
    return jsonResponse({ error: 'Session ID and Product ID required' }, corsHeaders, 400);
  }

  // Verify session
  const session = await env.DB.prepare(
    'SELECT * FROM ads_sessions WHERE sessionId = ? AND completed = 0'
  ).bind(sessionId).first();

  if (!session) {
    return jsonResponse({ error: 'Invalid or expired session' }, corsHeaders, 400);
  }

  // Get product
  const product = await env.DB.prepare(
    'SELECT * FROM products WHERE id = ?'
  ).bind(productId).first();

  if (!product) {
    return jsonResponse({ error: 'Product not found' }, corsHeaders, 404);
  }

  // Mark session complete
  await env.DB.prepare(
    'UPDATE ads_sessions SET completed = 1 WHERE sessionId = ?'
  ).bind(sessionId).run();

  // Increment downloads
  await env.DB.prepare(
    'UPDATE products SET downloads = downloads + 1 WHERE id = ?'
  ).bind(productId).run();

  return jsonResponse({
    success: true,
    downloadUrl: product.downloadUrl
  }, corsHeaders);
}

// ===== NEWSLETTER HANDLER =====

async function handleNewsletter(request, env, corsHeaders) {
  const { email, source } = await request.json();

  if (!email || !email.includes('@')) {
    return jsonResponse({ error: 'Valid email required' }, corsHeaders, 400);
  }

  try {
    await env.DB.prepare(
      'INSERT INTO newsletter (id, email, source, createdAt) VALUES (?, ?, ?, datetime("now"))'
    ).bind(generateId(), email.toLowerCase(), source || 'website').run();

    return jsonResponse({ success: true, message: 'Subscribed successfully' }, corsHeaders);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return jsonResponse({ success: true, exists: true, message: 'Already subscribed' }, corsHeaders);
    }
    throw error;
  }
}

// ===== CONTACT HANDLER =====

async function handleContact(request, env, corsHeaders) {
  const { name, email, subject, message } = await request.json();

  if (!name || !email || !message) {
    return jsonResponse({ error: 'Name, email and message required' }, corsHeaders, 400);
  }

  await env.DB.prepare(
    'INSERT INTO contact_messages (id, name, email, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, "unread", datetime("now"))'
  ).bind(generateId(), name, email, subject || '', message).run();

  return jsonResponse({ success: true, message: 'Message sent successfully' }, corsHeaders);
}

// ===== FLUTTERWAVE HANDLERS =====

async function handleFlutterwaveDonate(request, env, corsHeaders) {
  const { amount, email, name, phone } = await request.json();

  // Validate - email is REQUIRED
  if (!email || !email.includes('@')) {
    return jsonResponse({ 
      error: 'Missing parameter (customer_email): Kindly terminate this session and reconfirm the data.' 
    }, corsHeaders, 400);
  }

  if (!amount || amount < 1) {
    return jsonResponse({ error: 'Valid amount required' }, corsHeaders, 400);
  }

  const txRef = `5k-donate-${Date.now()}`;
  const siteUrl = env.SITE_URL || 'https://5kdigitalassets.com';

  // Call Flutterwave API
  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: amount,
      currency: 'USD',
      redirect_url: `${siteUrl}/support?payment=success`,
      customer: {
        email: email,
        name: name || 'Supporter',
        phonenumber: phone || ''
      },
      customizations: {
        title: '5K Digital Assets',
        description: 'Support Donation',
        logo: `${siteUrl}/images/logo.png`
      },
      meta: {
        type: 'donation'
      }
    })
  });

  const data = await response.json();

  if (data.status === 'success' && data.data?.link) {
    // Save transaction record
    await env.DB.prepare(
      'INSERT INTO donations (id, txRef, email, name, amount, status, createdAt) VALUES (?, ?, ?, ?, ?, "pending", datetime("now"))'
    ).bind(generateId(), txRef, email, name || 'Supporter', amount).run();

    return jsonResponse({
      success: true,
      link: data.data.link,
      txRef
    }, corsHeaders);
  }

  return jsonResponse({ 
    error: data.message || 'Failed to initialize payment' 
  }, corsHeaders, 400);
}

async function handleFlutterwaveVerify(request, env, corsHeaders) {
  const { txRef, transactionId } = await request.json();

  if (!txRef) {
    return jsonResponse({ error: 'Transaction reference required' }, corsHeaders, 400);
  }

  // Verify with Flutterwave
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      headers: {
        'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`
      }
    }
  );

  const data = await response.json();

  if (data.status === 'success' && data.data?.status === 'successful') {
    // Update donation record
    await env.DB.prepare(
      'UPDATE donations SET status = "completed", flutterwaveId = ? WHERE txRef = ?'
    ).bind(transactionId, txRef).run();

    return jsonResponse({ 
      success: true, 
      message: 'Payment verified successfully' 
    }, corsHeaders);
  }

  return jsonResponse({ 
    error: 'Payment verification failed' 
  }, corsHeaders, 400);
}

// ===== ADMIN AUTH HANDLERS =====

async function handleAdminCheckSetup(env, corsHeaders) {
  const admin = await env.DB.prepare('SELECT id FROM admin LIMIT 1').first();
  return jsonResponse({ 
    setupComplete: !!admin 
  }, corsHeaders);
}

async function handleAdminSetup(request, env, corsHeaders) {
  // Check if admin already exists - ONLY ONE ADMIN ALLOWED
  const existingAdmin = await env.DB.prepare('SELECT id FROM admin LIMIT 1').first();
  if (existingAdmin) {
    return jsonResponse({ error: 'Setup already complete. Only one admin account is allowed.' }, corsHeaders, 400);
  }

  const { email, password, name, recoveryQuestions } = await request.json();

  if (!email || !password || !name) {
    return jsonResponse({ error: 'All fields required' }, corsHeaders, 400);
  }

  // Strong password validation
  if (password.length < 12) {
    return jsonResponse({ error: 'Password must be at least 12 characters' }, corsHeaders, 400);
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return jsonResponse({ error: 'Password must contain uppercase, lowercase, and numbers' }, corsHeaders, 400);
  }

  // Generate salt and use pepper from environment
  const salt = generateId();
  const pepper = env.PASSWORD_PEPPER || 'default-pepper-change-in-production';
  const passwordHash = await hashPassword(password, salt, pepper);
  const adminId = generateId();

  // Store recovery questions if provided
  let recoveryQuestionsJson = null;
  if (recoveryQuestions) {
    // Hash the answers
    const hashedAnswers = {};
    for (const [key, value] of Object.entries(recoveryQuestions)) {
      if (key.startsWith('a')) {
        hashedAnswers[key] = await hashPassword(value.toLowerCase().trim(), salt, pepper);
      } else {
        hashedAnswers[key] = value;
      }
    }
    recoveryQuestionsJson = JSON.stringify(hashedAnswers);
  }

  await env.DB.prepare(
    'INSERT INTO admin (id, email, passwordHash, salt, name, recoveryQuestions, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
  ).bind(adminId, email.toLowerCase(), passwordHash, salt, name, recoveryQuestionsJson).run();

  return jsonResponse({ 
    success: true, 
    message: 'Admin account created. You can now login.' 
  }, corsHeaders);
}

async function handleAdminLogin(request, env, corsHeaders) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return jsonResponse({ error: 'Email and password required' }, corsHeaders, 400);
  }

  const admin = await env.DB.prepare(
    'SELECT * FROM admin WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  if (!admin) {
    return jsonResponse({ error: 'Invalid credentials' }, corsHeaders, 401);
  }

  // Check lockout
  if (admin.lockoutUntil && new Date(admin.lockoutUntil) > new Date()) {
    return jsonResponse({ 
      error: 'Account locked. Try again later.',
      lockoutUntil: admin.lockoutUntil
    }, corsHeaders, 429);
  }

  // Verify password with pepper
  const pepper = env.PASSWORD_PEPPER || 'default-pepper-change-in-production';
  const isValid = await verifyPassword(password, admin.passwordHash, admin.salt, pepper);
  
  if (!isValid) {
    // Increment attempts
    const newAttempts = (admin.loginAttempts || 0) + 1;
    const lockoutUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null;
    
    await env.DB.prepare(
      'UPDATE admin SET loginAttempts = ?, lockoutUntil = ? WHERE id = ?'
    ).bind(newAttempts, lockoutUntil, admin.id).run();

    return jsonResponse({ error: 'Invalid credentials' }, corsHeaders, 401);
  }

  // Reset attempts and update last login
  await env.DB.prepare(
    'UPDATE admin SET loginAttempts = 0, lockoutUntil = NULL, lastLogin = datetime("now") WHERE id = ?'
  ).bind(admin.id).run();

  // Create session
  const token = generateToken();
  const sessionId = generateId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT INTO sessions (id, adminId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, datetime("now"))'
  ).bind(sessionId, admin.id, token, expiresAt).run();

  return jsonResponse({
    success: true,
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name
    }
  }, corsHeaders);
}

// Admin Password Recovery
async function handleAdminRecover(request, env, corsHeaders) {
  const { email } = await request.json();

  if (!email) {
    return jsonResponse({ error: 'Email required' }, corsHeaders, 400);
  }

  const admin = await env.DB.prepare(
    'SELECT id, email, recoveryQuestions FROM admin WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  if (!admin) {
    // Don't reveal if email exists
    return jsonResponse({ success: true, message: 'If email exists, recovery options will be shown' }, corsHeaders);
  }

  if (!admin.recoveryQuestions) {
    return jsonResponse({ error: 'No recovery questions set up for this account' }, corsHeaders, 400);
  }

  const questions = JSON.parse(admin.recoveryQuestions);
  
  return jsonResponse({
    success: true,
    questions: {
      q1: questions.q1,
      q2: questions.q2,
      q3: questions.q3
    }
  }, corsHeaders);
}

async function handleAdminVerifyRecovery(request, env, corsHeaders) {
  const { email, answers } = await request.json();

  if (!email || !answers) {
    return jsonResponse({ error: 'Email and answers required' }, corsHeaders, 400);
  }

  const admin = await env.DB.prepare(
    'SELECT * FROM admin WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  if (!admin || !admin.recoveryQuestions) {
    return jsonResponse({ error: 'Invalid recovery attempt' }, corsHeaders, 400);
  }

  const questions = JSON.parse(admin.recoveryQuestions);
  const pepper = env.PASSWORD_PEPPER || 'default-pepper-change-in-production';

  // Verify answers
  let correctCount = 0;
  for (const [key, value] of Object.entries(answers)) {
    if (key.startsWith('a') && questions[key]) {
      const hashedAnswer = await hashPassword(value.toLowerCase().trim(), admin.salt, pepper);
      if (hashedAnswer === questions[key]) {
        correctCount++;
      }
    }
  }

  if (correctCount < 3) {
    return jsonResponse({ error: 'Incorrect answers. Please try again.' }, corsHeaders, 400);
  }

  // Generate reset token
  const resetToken = generateToken();
  const resetExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await env.DB.prepare(
    'UPDATE admin SET resetToken = ?, resetTokenExpires = ? WHERE id = ?'
  ).bind(resetToken, resetExpires, admin.id).run();

  return jsonResponse({
    success: true,
    resetToken
  }, corsHeaders);
}

async function handleAdminLogout(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return jsonResponse({ success: true }, corsHeaders);
}

// ===== ADMIN PROFILE =====

async function handleAdminGetProfile(env, adminId, corsHeaders) {
  const admin = await env.DB.prepare(
    'SELECT id, email, name, lastLogin, loginAttempts, recoveryQuestions, passwordChanged, createdAt FROM admin WHERE id = ?'
  ).bind(adminId).first();

  if (!admin) {
    return jsonResponse({ error: 'Admin not found' }, corsHeaders, 404);
  }

  let recoveryQuestions = null;
  if (admin.recoveryQuestions) {
    const parsed = JSON.parse(admin.recoveryQuestions);
    recoveryQuestions = {
      q1: parsed.q1,
      q2: parsed.q2,
      q3: parsed.q3
    };
  }

  return jsonResponse({
    success: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      lastLogin: admin.lastLogin,
      loginAttempts: admin.loginAttempts,
      passwordChanged: admin.passwordChanged,
      recoveryQuestions,
      createdAt: admin.createdAt
    }
  }, corsHeaders);
}

async function handleAdminUpdateProfile(request, env, adminId, corsHeaders) {
  const { name } = await request.json();

  if (!name || name.length < 2) {
    return jsonResponse({ error: 'Name must be at least 2 characters' }, corsHeaders, 400);
  }

  await env.DB.prepare(
    'UPDATE admin SET name = ? WHERE id = ?'
  ).bind(name, adminId).run();

  return jsonResponse({ success: true, message: 'Profile updated' }, corsHeaders);
}

async function handleAdminChangePassword(request, env, adminId, corsHeaders) {
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return jsonResponse({ error: 'Current and new password required' }, corsHeaders, 400);
  }

  if (newPassword.length < 12) {
    return jsonResponse({ error: 'Password must be at least 12 characters' }, corsHeaders, 400);
  }

  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return jsonResponse({ error: 'Password must contain uppercase, lowercase, and numbers' }, corsHeaders, 400);
  }

  const admin = await env.DB.prepare(
    'SELECT * FROM admin WHERE id = ?'
  ).bind(adminId).first();

  if (!admin) {
    return jsonResponse({ error: 'Admin not found' }, corsHeaders, 404);
  }

  // Verify current password
  const pepper = env.PASSWORD_PEPPER || 'default-pepper-change-in-production';
  const isValid = await verifyPassword(currentPassword, admin.passwordHash, admin.salt, pepper);

  if (!isValid) {
    return jsonResponse({ error: 'Current password is incorrect' }, corsHeaders, 400);
  }

  // Generate new salt and hash
  const newSalt = generateId();
  const newHash = await hashPassword(newPassword, newSalt, pepper);

  await env.DB.prepare(
    'UPDATE admin SET passwordHash = ?, salt = ?, passwordChanged = datetime("now") WHERE id = ?'
  ).bind(newHash, newSalt, adminId).run();

  // Invalidate all existing sessions except current
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const currentToken = authHeader.substring(7);
    await env.DB.prepare(
      'DELETE FROM sessions WHERE adminId = ? AND token != ?'
    ).bind(adminId, currentToken).run();
  }

  return jsonResponse({ success: true, message: 'Password changed successfully' }, corsHeaders);
}

async function handleAdminSetRecoveryQuestions(request, env, adminId, corsHeaders) {
  const questions = await request.json();

  if (!questions.q1 || !questions.a1 || !questions.q2 || !questions.a2 || !questions.q3 || !questions.a3) {
    return jsonResponse({ error: 'All questions and answers are required' }, corsHeaders, 400);
  }

  const admin = await env.DB.prepare('SELECT salt FROM admin WHERE id = ?').bind(adminId).first();
  if (!admin) {
    return jsonResponse({ error: 'Admin not found' }, corsHeaders, 404);
  }

  // Hash answers
  const pepper = env.PASSWORD_PEPPER || 'default-pepper-change-in-production';
  const hashedQuestions = {
    q1: questions.q1,
    a1: await hashPassword(questions.a1.toLowerCase().trim(), admin.salt, pepper),
    q2: questions.q2,
    a2: await hashPassword(questions.a2.toLowerCase().trim(), admin.salt, pepper),
    q3: questions.q3,
    a3: await hashPassword(questions.a3.toLowerCase().trim(), admin.salt, pepper)
  };

  await env.DB.prepare(
    'UPDATE admin SET recoveryQuestions = ? WHERE id = ?'
  ).bind(JSON.stringify(hashedQuestions), adminId).run();

  return jsonResponse({ success: true, message: 'Recovery questions saved' }, corsHeaders);
}

// ===== ADMIN ADS CONFIG =====

async function handleAdminGetAdsConfig(env, corsHeaders) {
  try {
    const result = await env.DB.prepare(
      'SELECT config FROM ads_config WHERE id = "main"'
    ).first();

    if (result?.config) {
      return jsonResponse({ success: true, config: JSON.parse(result.config) }, corsHeaders);
    }
  } catch (e) {}

  return jsonResponse({ success: true, config: {} }, corsHeaders);
}

async function handleAdminSetAdsConfig(request, env, corsHeaders) {
  const config = await request.json();

  // Validate config structure - includes Adsterra, Monetag, and AdSense
  const validConfig = {
    // Adsterra (existing)
    adsterra: {
      enabled: !!config.adsterra?.enabled,
      popunder: {
        enabled: !!config.adsterra?.popunder?.enabled,
        script: String(config.adsterra?.popunder?.script || '').trim()
      },
      banner: {
        enabled: !!config.adsterra?.banner?.enabled,
        script: String(config.adsterra?.banner?.script || '').trim(),
        position: ['top', 'bottom', 'both'].includes(config.adsterra?.banner?.position) ? config.adsterra.banner.position : 'bottom'
      },
      native: {
        enabled: !!config.adsterra?.native?.enabled,
        script: String(config.adsterra?.native?.script || '').trim()
      },
      socialbar: {
        enabled: !!config.adsterra?.socialbar?.enabled,
        script: String(config.adsterra?.socialbar?.script || '').trim()
      },
      interstitial: {
        enabled: !!config.adsterra?.interstitial?.enabled,
        script: String(config.adsterra?.interstitial?.script || '').trim()
      }
    },
    // Monetag (new)
    monetag: {
      enabled: !!config.monetag?.enabled,
      publisherId: String(config.monetag?.publisherId || '').trim(),
      popunder: {
        enabled: !!config.monetag?.popunder?.enabled,
        zoneId: String(config.monetag?.popunder?.zoneId || '').trim()
      },
      native: {
        enabled: !!config.monetag?.native?.enabled,
        zoneId: String(config.monetag?.native?.zoneId || '').trim()
      },
      banner: {
        enabled: !!config.monetag?.banner?.enabled,
        zoneId: String(config.monetag?.banner?.zoneId || '').trim(),
        position: ['top', 'bottom', 'both'].includes(config.monetag?.banner?.position) ? config.monetag.banner.position : 'bottom'
      },
      interstitial: {
        enabled: !!config.monetag?.interstitial?.enabled,
        zoneId: String(config.monetag?.interstitial?.zoneId || '').trim()
      },
      smartlink: {
        enabled: !!config.monetag?.smartlink?.enabled,
        zoneId: String(config.monetag?.smartlink?.zoneId || '').trim()
      }
    },
    // Google AdSense (new)
    adsense: {
      enabled: !!config.adsense?.enabled,
      publisherId: String(config.adsense?.publisherId || '').trim(), // ca-pub-XXXXXXXX
      autoAds: {
        enabled: !!config.adsense?.autoAds?.enabled
      },
      displayAds: {
        enabled: !!config.adsense?.displayAds?.enabled,
        slots: {
          header: String(config.adsense?.displayAds?.slots?.header || '').trim(),
          sidebar: String(config.adsense?.displayAds?.slots?.sidebar || '').trim(),
          inContent: String(config.adsense?.displayAds?.slots?.inContent || '').trim(),
          footer: String(config.adsense?.displayAds?.slots?.footer || '').trim()
        }
      },
      inArticle: {
        enabled: !!config.adsense?.inArticle?.enabled,
        slotId: String(config.adsense?.inArticle?.slotId || '').trim()
      }
    },
    // Download timer (existing)
    timer: {
      enabled: config.timer?.enabled !== false,
      duration: Math.max(5, Math.min(60, parseInt(config.timer?.duration) || 10)),
      showAd: !!config.timer?.showAd
    }
  };

  // Upsert config
  await env.DB.prepare(
    `INSERT INTO ads_config (id, config, updatedAt) VALUES ("main", ?, datetime("now"))
     ON CONFLICT(id) DO UPDATE SET config = ?, updatedAt = datetime("now")`
  ).bind(JSON.stringify(validConfig), JSON.stringify(validConfig)).run();

  return jsonResponse({ success: true, message: 'Ads configuration saved', config: validConfig }, corsHeaders);
}

// ===== ADMIN STATS =====

async function handleAdminStats(env, corsHeaders) {
  const [products, downloads, messages, subscribers] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM products').first(),
    env.DB.prepare('SELECT SUM(downloads) as total FROM products').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE status = "unread"').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM newsletter').first()
  ]);

  return jsonResponse({
    success: true,
    stats: {
      totalProducts: products?.count || 0,
      totalDownloads: downloads?.total || 0,
      unreadMessages: messages?.count || 0,
      totalSubscribers: subscribers?.count || 0
    }
  }, corsHeaders);
}

// ===== ADMIN PRODUCTS CRUD =====

async function handleAdminGetProducts(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM products ORDER BY createdAt DESC'
  ).all();

  return jsonResponse({ success: true, products: results }, corsHeaders);
}

async function handleAdminCreateProduct(request, env, corsHeaders) {
  const { title, description, image, type, size, downloadUrl } = await request.json();

  if (!title) {
    return jsonResponse({ error: 'Title required' }, corsHeaders, 400);
  }

  const id = generateId();

  await env.DB.prepare(
    'INSERT INTO products (id, title, description, image, type, size, downloadUrl, downloads, views, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, datetime("now"))'
  ).bind(id, title, description || '', image || '', type || 'Digital', size || '', downloadUrl || '').run();

  return jsonResponse({ success: true, id }, corsHeaders);
}

async function handleAdminUpdateProduct(request, env, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const { title, description, image, type, size, downloadUrl } = await request.json();

  await env.DB.prepare(
    'UPDATE products SET title = COALESCE(?, title), description = COALESCE(?, description), image = COALESCE(?, image), type = COALESCE(?, type), size = COALESCE(?, size), downloadUrl = COALESCE(?, downloadUrl) WHERE id = ?'
  ).bind(title, description, image, type, size, downloadUrl, id).run();

  return jsonResponse({ success: true }, corsHeaders);
}

async function handleAdminDeleteProduct(request, env, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

  return jsonResponse({ success: true }, corsHeaders);
}

// ===== ADMIN MESSAGES =====

async function handleAdminGetMessages(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM contact_messages ORDER BY createdAt DESC LIMIT 100'
  ).all();

  return jsonResponse({ success: true, messages: results }, corsHeaders);
}

async function handleAdminDeleteMessage(request, env, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').filter(p => p)[3];

  await env.DB.prepare('DELETE FROM contact_messages WHERE id = ?').bind(id).run();

  return jsonResponse({ success: true }, corsHeaders);
}

async function handleAdminMarkMessageRead(request, env, corsHeaders) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(p => p);
  const id = parts[3];

  await env.DB.prepare(
    'UPDATE contact_messages SET status = "read" WHERE id = ?'
  ).bind(id).run();

  return jsonResponse({ success: true }, corsHeaders);
}

// ===== ADMIN NEWSLETTER =====

async function handleAdminGetNewsletter(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM newsletter ORDER BY createdAt DESC'
  ).all();

  return jsonResponse({ success: true, subscribers: results }, corsHeaders);
}

async function handleAdminExportNewsletter(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT email, source, createdAt FROM newsletter ORDER BY createdAt DESC'
  ).all();

  const csv = 'Email,Source,Subscribed At\n' + results.map(s => 
    `"${s.email}","${s.source || 'Website'}","${s.createdAt}"`
  ).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="subscribers.csv"',
      ...corsHeaders
    }
  });
}
