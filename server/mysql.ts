import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function initializeMySQL(): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    console.log('[mysql] Connected to Hostinger MySQL database');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        supabase_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        profile_image_url TEXT,
        is_subscribed TINYINT(1) DEFAULT 0,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        custom_domain VARCHAR(255) UNIQUE,
        custom_domain_verified TINYINT(1) DEFAULT 0,
        custom_domain_verified_at DATETIME,
        custom_domain_verification_token VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Add custom domain columns if they don't exist (for existing databases)
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN custom_domain VARCHAR(255) UNIQUE`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column')) throw e;
    }
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN custom_domain_verified TINYINT(1) DEFAULT 0`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column')) throw e;
    }
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN custom_domain_verified_at DATETIME`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column')) throw e;
    }
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN custom_domain_verification_token VARCHAR(255)`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column')) throw e;
    }
    console.log('[mysql] Users table ready');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS link_pages (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        background_color VARCHAR(50) DEFAULT '#FF6600',
        text_color VARCHAR(50) DEFAULT '#FFFFFF',
        gtm_container_id VARCHAR(50),
        page_type VARCHAR(50) DEFAULT 'standard',
        artist_name VARCHAR(255),
        release_date VARCHAR(255),
        cover_art_url TEXT,
        upcoming_events TEXT,
        merchandise_url TEXT,
        website_url TEXT,
        social_links JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('[mysql] Link pages table ready');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS links (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        link_page_id BIGINT NOT NULL,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        icon VARCHAR(255),
        \`order\` INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        link_type VARCHAR(50) DEFAULT 'custom',
        streaming_platform VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (link_page_id) REFERENCES link_pages(id) ON DELETE CASCADE
      )
    `);
    console.log('[mysql] Links table ready');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS link_clicks (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        link_id BIGINT NOT NULL,
        link_page_id BIGINT NOT NULL,
        clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        referrer VARCHAR(2048),
        user_agent VARCHAR(1024),
        country VARCHAR(10),
        FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
        FOREIGN KEY (link_page_id) REFERENCES link_pages(id) ON DELETE CASCADE
      )
    `);
    console.log('[mysql] Link clicks table ready');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS domain_mappings (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        link_page_id BIGINT NOT NULL,
        domain_type ENUM('subdomain', 'custom') NOT NULL DEFAULT 'subdomain',
        hostname VARCHAR(255) NOT NULL UNIQUE,
        verification_status ENUM('pending', 'verifying', 'verified', 'failed') DEFAULT 'pending',
        verification_token VARCHAR(255),
        last_checked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (link_page_id) REFERENCES link_pages(id) ON DELETE CASCADE,
        INDEX idx_hostname (hostname),
        INDEX idx_link_page (link_page_id)
      )
    `);
    console.log('[mysql] Domain mappings table ready');
    
    console.log('[mysql] All tables initialized successfully');
  } finally {
    connection.release();
  }
}

export { pool };
