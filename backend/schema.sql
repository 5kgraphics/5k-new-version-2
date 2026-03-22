-- 5K Digital Assets - Cloudflare D1 Database Schema
-- Complete schema with all features
-- Run this in Cloudflare Dashboard > D1 > Console

-- Admin table (single admin only - ENFORCED)
CREATE TABLE IF NOT EXISTS admin (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  salt TEXT NOT NULL,
  name TEXT,
  recoveryQuestions TEXT,
  resetToken TEXT,
  resetTokenExpires TEXT,
  loginAttempts INTEGER DEFAULT 0,
  lockoutUntil TEXT,
  lastLogin TEXT,
  passwordChanged TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  adminId TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (adminId) REFERENCES admin(id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  type TEXT DEFAULT 'Digital',
  size TEXT,
  downloadUrl TEXT,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'unread',
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Ads/Download sessions for timer wall
CREATE TABLE IF NOT EXISTS ads_sessions (
  id TEXT PRIMARY KEY,
  sessionId TEXT UNIQUE NOT NULL,
  productId TEXT NOT NULL,
  ipAddress TEXT,
  completed INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  txRef TEXT UNIQUE NOT NULL,
  flutterwaveId TEXT,
  email TEXT NOT NULL,
  name TEXT,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Ads Configuration (Server-side ad injection)
CREATE TABLE IF NOT EXISTS ads_config (
  id TEXT PRIMARY KEY,
  config TEXT NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(createdAt);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_admin ON sessions(adminId);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expiresAt);
CREATE INDEX IF NOT EXISTS idx_ads_session ON ads_sessions(sessionId);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter(email);
CREATE INDEX IF NOT EXISTS idx_messages_status ON contact_messages(status);

-- Insert default ads config
INSERT OR IGNORE INTO ads_config (id, config, updatedAt) VALUES ('main', '{"timer":{"enabled":true,"duration":10}}', datetime('now'));

-- Insert sample products (optional - remove if not needed)
INSERT OR IGNORE INTO products (id, title, description, image, type, size, downloadUrl, downloads, views, createdAt) VALUES
('prod_001', 'Modern UI Kit Pro', '<p>A comprehensive UI kit with <strong>200+ components</strong> for modern web applications.</p><ul><li>Buttons, forms, cards, modals</li><li>Dark and light themes</li><li>Figma source files included</li></ul>', 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&h=600&fit=crop', 'UI-Kit', '125 MB', 'https://example.com/download/ui-kit-pro', 450, 1250, datetime('now')),
('prod_002', 'Premium Font Bundle', '<p>Collection of <strong>25 premium fonts</strong> for creative projects.</p><ul><li>Serif, sans-serif, script fonts</li><li>Desktop & web licenses</li><li>OTF, TTF, WOFF formats</li></ul>', 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=800&h=600&fit=crop', 'Font', '45 MB', 'https://example.com/download/font-bundle', 320, 980, datetime('now')),
('prod_003', 'Lightroom Presets Pack', '<p><strong>50 professional Lightroom presets</strong> for stunning photo editing.</p><ul><li>Perfect for portraits & landscapes</li><li>Mobile & desktop compatible</li><li>Installation guide included</li></ul>', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop', 'Preset', '12 MB', 'https://example.com/download/lr-presets', 890, 2100, datetime('now')),
('prod_004', 'Web Template Collection', '<p><strong>10 responsive website templates</strong> built with HTML, CSS, and JavaScript.</p><ul><li>Portfolio, blog, business templates</li><li>Clean, modern design</li><li>Well-documented code</li></ul>', 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', 'Template', '85 MB', 'https://example.com/download/web-templates', 620, 1580, datetime('now')),
('prod_005', 'Texture Pack Vol.1', '<p><strong>100 high-resolution textures</strong> for design projects.</p><ul><li>Paper, concrete, fabric textures</li><li>4000x4000 pixels</li><li>JPEG & PNG formats</li></ul>', 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&h=600&fit=crop', 'Texture', '350 MB', 'https://example.com/download/texture-pack', 280, 750, datetime('now')),
('prod_006', 'Photoshop Brushes Set', '<p><strong>150 creative Photoshop brushes</strong> for digital art.</p><ul><li>Watercolor, splatter, grunge styles</li><li>High-resolution brushes</li><li>Compatible with PS CC+</li></ul>', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop', 'Brush', '65 MB', 'https://example.com/download/ps-brushes', 410, 1120, datetime('now')),
('prod_007', 'E-Book: Design Basics', '<p>Learn the fundamentals of design with this comprehensive e-book.</p><ul><li>Color theory</li><li>Typography basics</li><li>Layout principles</li><li>Practical exercises</li></ul>', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop', 'Ebook', '15 MB', 'https://example.com/download/design-ebook', 520, 1300, datetime('now')),
('prod_008', 'Video Transitions Pack', '<p><strong>50 smooth video transitions</strong> for video editing.</p><ul><li>Works with Premiere Pro, DaVinci</li><li>4K resolution support</li><li>Easy drag and drop</li></ul>', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop', 'Videos', '200 MB', 'https://example.com/download/video-transitions', 180, 520, datetime('now'));
