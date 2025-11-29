import { pool } from './mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from './db';
import { sql } from 'drizzle-orm';

export interface User {
  id: string;
  supabaseId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isSubscribed: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  customDomainVerifiedAt: Date | null;
  customDomainVerificationToken: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UpsertUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  isSubscribed?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export interface SocialMediaLinks {
  facebook?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  custom?: string;
}

export interface LinkPage {
  id: string;
  userId: string;
  slug: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  gtmContainerId: string | null;
  pageType: string | null;
  artistName: string | null;
  releaseDate: string | null;
  coverArtUrl: string | null;
  upcomingEvents: string | null;
  merchandiseUrl: string | null;
  websiteUrl: string | null;
  socialLinks: SocialMediaLinks | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface InsertLinkPage {
  userId: string;
  slug: string;
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  gtmContainerId?: string | null;
  pageType?: string | null;
  artistName?: string | null;
  releaseDate?: string | null;
  coverArtUrl?: string | null;
  upcomingEvents?: string | null;
  merchandiseUrl?: string | null;
  websiteUrl?: string | null;
  socialLinks?: SocialMediaLinks | null;
}

export interface Link {
  id: string;
  linkPageId: string;
  title: string;
  url: string;
  icon: string | null;
  order: number | null;
  isActive: boolean | null;
  linkType: string | null;
  streamingPlatform: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface InsertLink {
  linkPageId: string;
  title: string;
  url: string;
  icon?: string | null;
  order?: number | null;
  isActive?: boolean | null;
  linkType?: string | null;
  streamingPlatform?: string | null;
}

export interface LinkClick {
  id: string;
  linkId: string;
  linkPageId: string;
  clickedAt: Date | null;
  referrer: string | null;
  userAgent: string | null;
  country: string | null;
}

export interface DomainMapping {
  id: string;
  linkPageId: string;
  domainType: 'subdomain' | 'custom';
  hostname: string;
  verificationStatus: 'pending' | 'verifying' | 'verified' | 'failed';
  verificationToken: string | null;
  lastCheckedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface InsertDomainMapping {
  linkPageId: string;
  domainType: 'subdomain' | 'custom';
  hostname: string;
  verificationToken?: string | null;
}

interface UserRow extends RowDataPacket {
  id: number;
  supabase_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  is_subscribed: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  custom_domain: string | null;
  custom_domain_verified: number;
  custom_domain_verified_at: Date | null;
  custom_domain_verification_token: string | null;
  created_at: Date;
  updated_at: Date;
}

interface LinkPageRow extends RowDataPacket {
  id: number;
  user_id: number;
  slug: string;
  title: string;
  bio: string | null;
  avatar_url: string | null;
  background_color: string | null;
  text_color: string | null;
  gtm_container_id: string | null;
  page_type: string | null;
  artist_name: string | null;
  release_date: string | null;
  cover_art_url: string | null;
  upcoming_events: string | null;
  merchandise_url: string | null;
  website_url: string | null;
  social_links: string | null;
  created_at: Date;
  updated_at: Date;
}

interface LinkRow extends RowDataPacket {
  id: number;
  link_page_id: number;
  title: string;
  url: string;
  icon: string | null;
  order: number;
  is_active: number;
  link_type: string | null;
  streaming_platform: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface ClickStatsRow extends RowDataPacket {
  link_id: number;
  clicks: number;
}

interface DomainMappingRow extends RowDataPacket {
  id: number;
  link_page_id: number;
  domain_type: 'subdomain' | 'custom';
  hostname: string;
  verification_status: 'pending' | 'verifying' | 'verified' | 'failed';
  verification_token: string | null;
  last_checked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapDomainMappingRow(row: DomainMappingRow): DomainMapping {
  return {
    id: String(row.id),
    linkPageId: String(row.link_page_id),
    domainType: row.domain_type,
    hostname: row.hostname,
    verificationStatus: row.verification_status,
    verificationToken: row.verification_token,
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.supabase_id,
    supabaseId: row.supabase_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    profileImageUrl: row.profile_image_url,
    isSubscribed: row.is_subscribed === 1,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    customDomain: row.custom_domain,
    customDomainVerified: row.custom_domain_verified === 1,
    customDomainVerifiedAt: row.custom_domain_verified_at,
    customDomainVerificationToken: row.custom_domain_verification_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLinkPageRow(row: LinkPageRow): LinkPage {
  let socialLinks: SocialMediaLinks | null = null;
  if (row.social_links) {
    try {
      socialLinks = typeof row.social_links === 'string' 
        ? JSON.parse(row.social_links) 
        : row.social_links;
    } catch {
      socialLinks = null;
    }
  }
  
  return {
    id: String(row.id),
    userId: String(row.user_id),
    slug: row.slug,
    title: row.title,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    gtmContainerId: row.gtm_container_id,
    pageType: row.page_type,
    artistName: row.artist_name,
    releaseDate: row.release_date,
    coverArtUrl: row.cover_art_url,
    upcomingEvents: row.upcoming_events,
    merchandiseUrl: row.merchandise_url,
    websiteUrl: row.website_url,
    socialLinks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLinkRow(row: LinkRow): Link {
  return {
    id: String(row.id),
    linkPageId: String(row.link_page_id),
    title: row.title,
    url: row.url,
    icon: row.icon,
    order: row.order,
    isActive: row.is_active === 1,
    linkType: row.link_type,
    streamingPlatform: row.streaming_platform,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getLinkPagesByUserId(userId: string): Promise<LinkPage[]>;
  getLinkPageByUserId(userId: string): Promise<LinkPage | undefined>;
  getLinkPageBySlug(slug: string): Promise<LinkPage | undefined>;
  getLinkPageById(id: string): Promise<LinkPage | undefined>;
  createLinkPage(linkPage: InsertLinkPage): Promise<LinkPage>;
  updateLinkPage(id: string, linkPage: Partial<InsertLinkPage>): Promise<LinkPage | undefined>;
  deleteLinkPage(id: string): Promise<void>;
  getPageCountByUserId(userId: string): Promise<number>;
  
  getLinksByPageId(linkPageId: string): Promise<Link[]>;
  getLink(id: string): Promise<Link | undefined>;
  createLink(link: InsertLink): Promise<Link>;
  updateLink(id: string, link: Partial<InsertLink>): Promise<Link | undefined>;
  deleteLink(id: string): Promise<void>;
  reorderLinks(linkPageId: string, linkIds: string[]): Promise<void>;
  
  recordClick(linkId: string, linkPageId: string, metadata: { referrer?: string; userAgent?: string; country?: string }): Promise<void>;
  getClickStats(linkPageId: string): Promise<{ totalClicks: number; clicksByLink: { linkId: string; clicks: number }[] }>;
  getTotalClicksByUserId(userId: string): Promise<number>;
  
  getDomainByHostname(hostname: string): Promise<DomainMapping | undefined>;
  getDomainsByPageId(linkPageId: string): Promise<DomainMapping[]>;
  getDomainById(id: string): Promise<DomainMapping | undefined>;
  createDomain(domain: InsertDomainMapping): Promise<DomainMapping>;
  updateDomainStatus(id: string, status: 'pending' | 'verifying' | 'verified' | 'failed'): Promise<DomainMapping | undefined>;
  deleteDomain(id: string): Promise<void>;
  isHostnameAvailable(hostname: string): Promise<boolean>;
  getLinkPageByHostname(hostname: string): Promise<LinkPage | undefined>;
  
  // Account-level custom domain methods
  setUserCustomDomain(userId: string, domain: string, verificationToken: string): Promise<User>;
  verifyUserCustomDomain(userId: string): Promise<User>;
  removeUserCustomDomain(userId: string): Promise<User>;
  getUserByCustomDomain(domain: string): Promise<User | undefined>;
  isCustomDomainAvailable(domain: string): Promise<boolean>;
}

export class MySQLStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE supabase_id = ?',
      [id]
    );
    return rows.length > 0 ? mapUserRow(rows[0]) : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First, check if user exists by supabase_id
    let existingUser = await this.getUser(userData.id);
    
    // If not found by supabase_id, check by email (handles Supabase ID changes)
    if (!existingUser && userData.email) {
      const [rows] = await pool.query<UserRow[]>(
        'SELECT * FROM users WHERE email = ?',
        [userData.email]
      );
      if (rows.length > 0) {
        existingUser = mapUserRow(rows[0]);
        console.log('[storage] Found existing user by email, updating supabase_id');
        // Update the supabase_id to the new one
        await pool.query(
          'UPDATE users SET supabase_id = ? WHERE email = ?',
          [userData.id, userData.email]
        );
      }
    }
    
    if (existingUser) {
      const updates: string[] = [];
      const values: any[] = [];
      
      // Always update supabase_id if it changed
      updates.push('supabase_id = ?');
      values.push(userData.id);
      
      if (userData.email !== undefined) {
        updates.push('email = ?');
        values.push(userData.email);
      }
      if (userData.firstName !== undefined) {
        updates.push('first_name = ?');
        values.push(userData.firstName);
      }
      if (userData.lastName !== undefined) {
        updates.push('last_name = ?');
        values.push(userData.lastName);
      }
      if (userData.profileImageUrl !== undefined) {
        updates.push('profile_image_url = ?');
        values.push(userData.profileImageUrl);
      }
      if (userData.isSubscribed !== undefined) {
        updates.push('is_subscribed = ?');
        values.push(userData.isSubscribed ? 1 : 0);
      }
      if (userData.stripeCustomerId !== undefined) {
        updates.push('stripe_customer_id = ?');
        values.push(userData.stripeCustomerId);
      }
      if (userData.stripeSubscriptionId !== undefined) {
        updates.push('stripe_subscription_id = ?');
        values.push(userData.stripeSubscriptionId);
      }
      
      if (updates.length > 0) {
        values.push(userData.email || existingUser.email);
        await pool.query(
          `UPDATE users SET ${updates.join(', ')} WHERE email = ?`,
          values
        );
      }
      
      return (await this.getUser(userData.id))!;
    } else {
      await pool.query<ResultSetHeader>(
        `INSERT INTO users (supabase_id, email, first_name, last_name, profile_image_url, is_subscribed, stripe_customer_id, stripe_subscription_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.id,
          userData.email || null,
          userData.firstName || null,
          userData.lastName || null,
          userData.profileImageUrl || null,
          userData.isSubscribed ? 1 : 0,
          userData.stripeCustomerId || null,
          userData.stripeSubscriptionId || null,
        ]
      );
      return (await this.getUser(userData.id))!;
    }
  }

  private async getUserInternalId(supabaseId: string): Promise<number | undefined> {
    console.log('[storage] getUserInternalId looking for supabaseId:', supabaseId);
    try {
      const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
        'SELECT id FROM users WHERE supabase_id = ?',
        [supabaseId]
      );
      console.log('[storage] getUserInternalId query returned', rows.length, 'rows');
      return rows.length > 0 ? rows[0].id : undefined;
    } catch (error) {
      console.error('[storage] getUserInternalId error:', error);
      return undefined;
    }
  }

  async getLinkPagesByUserId(userId: string): Promise<LinkPage[]> {
    console.log('[storage] getLinkPagesByUserId called with userId:', userId);
    const internalId = await this.getUserInternalId(userId);
    console.log('[storage] getUserInternalId returned:', internalId);
    if (!internalId) {
      console.log('[storage] No internal ID found, returning empty array');
      return [];
    }
    
    const [rows] = await pool.query<LinkPageRow[]>(
      'SELECT * FROM link_pages WHERE user_id = ? ORDER BY created_at',
      [internalId]
    );
    console.log('[storage] Found', rows.length, 'pages for user');
    return rows.map(row => ({
      ...mapLinkPageRow(row),
      userId: userId,
    }));
  }

  async getLinkPageByUserId(userId: string): Promise<LinkPage | undefined> {
    const pages = await this.getLinkPagesByUserId(userId);
    return pages.length > 0 ? pages[0] : undefined;
  }

  async getLinkPageBySlug(slug: string): Promise<LinkPage | undefined> {
    const [rows] = await pool.query<LinkPageRow[]>(
      'SELECT lp.*, u.supabase_id FROM link_pages lp JOIN users u ON lp.user_id = u.id WHERE lp.slug = ?',
      [slug]
    );
    if (rows.length === 0) return undefined;
    
    const row = rows[0] as LinkPageRow & { supabase_id: string };
    return {
      ...mapLinkPageRow(row),
      userId: row.supabase_id,
    };
  }

  async getLinkPageById(id: string): Promise<LinkPage | undefined> {
    const [rows] = await pool.query<LinkPageRow[]>(
      'SELECT lp.*, u.supabase_id FROM link_pages lp JOIN users u ON lp.user_id = u.id WHERE lp.id = ?',
      [id]
    );
    if (rows.length === 0) return undefined;
    
    const row = rows[0] as LinkPageRow & { supabase_id: string };
    return {
      ...mapLinkPageRow(row),
      userId: row.supabase_id,
    };
  }

  async createLinkPage(linkPage: InsertLinkPage): Promise<LinkPage> {
    const internalId = await this.getUserInternalId(linkPage.userId);
    if (!internalId) {
      throw new Error('User not found');
    }
    
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO link_pages (user_id, slug, title, bio, avatar_url, background_color, text_color, gtm_container_id, page_type, artist_name, release_date, cover_art_url, upcoming_events, merchandise_url, website_url, social_links)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        internalId,
        linkPage.slug,
        linkPage.title,
        linkPage.bio || null,
        linkPage.avatarUrl || null,
        linkPage.backgroundColor || '#FF6600',
        linkPage.textColor || '#FFFFFF',
        linkPage.gtmContainerId || null,
        linkPage.pageType || 'standard',
        linkPage.artistName || null,
        linkPage.releaseDate || null,
        linkPage.coverArtUrl || null,
        linkPage.upcomingEvents || null,
        linkPage.merchandiseUrl || null,
        linkPage.websiteUrl || null,
        linkPage.socialLinks ? JSON.stringify(linkPage.socialLinks) : null,
      ]
    );
    
    return (await this.getLinkPageById(String(result.insertId)))!;
  }

  async updateLinkPage(id: string, linkPage: Partial<InsertLinkPage>): Promise<LinkPage | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (linkPage.slug !== undefined) {
      updates.push('slug = ?');
      values.push(linkPage.slug);
    }
    if (linkPage.title !== undefined) {
      updates.push('title = ?');
      values.push(linkPage.title);
    }
    if (linkPage.bio !== undefined) {
      updates.push('bio = ?');
      values.push(linkPage.bio);
    }
    if (linkPage.avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      values.push(linkPage.avatarUrl);
    }
    if (linkPage.backgroundColor !== undefined) {
      updates.push('background_color = ?');
      values.push(linkPage.backgroundColor);
    }
    if (linkPage.textColor !== undefined) {
      updates.push('text_color = ?');
      values.push(linkPage.textColor);
    }
    if (linkPage.gtmContainerId !== undefined) {
      updates.push('gtm_container_id = ?');
      values.push(linkPage.gtmContainerId);
    }
    if (linkPage.pageType !== undefined) {
      updates.push('page_type = ?');
      values.push(linkPage.pageType);
    }
    if (linkPage.artistName !== undefined) {
      updates.push('artist_name = ?');
      values.push(linkPage.artistName);
    }
    if (linkPage.releaseDate !== undefined) {
      updates.push('release_date = ?');
      values.push(linkPage.releaseDate);
    }
    if (linkPage.coverArtUrl !== undefined) {
      updates.push('cover_art_url = ?');
      values.push(linkPage.coverArtUrl);
    }
    if (linkPage.upcomingEvents !== undefined) {
      updates.push('upcoming_events = ?');
      values.push(linkPage.upcomingEvents);
    }
    if (linkPage.merchandiseUrl !== undefined) {
      updates.push('merchandise_url = ?');
      values.push(linkPage.merchandiseUrl);
    }
    if (linkPage.websiteUrl !== undefined) {
      updates.push('website_url = ?');
      values.push(linkPage.websiteUrl);
    }
    if (linkPage.socialLinks !== undefined) {
      updates.push('social_links = ?');
      values.push(linkPage.socialLinks ? JSON.stringify(linkPage.socialLinks) : null);
    }
    
    if (updates.length === 0) {
      return this.getLinkPageById(id);
    }
    
    values.push(id);
    await pool.query(
      `UPDATE link_pages SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getLinkPageById(id);
  }

  async deleteLinkPage(id: string): Promise<void> {
    await pool.query('DELETE FROM link_pages WHERE id = ?', [id]);
  }

  async getPageCountByUserId(userId: string): Promise<number> {
    const internalId = await this.getUserInternalId(userId);
    if (!internalId) return 0;
    
    const [rows] = await pool.query<CountRow[]>(
      'SELECT COUNT(*) as count FROM link_pages WHERE user_id = ?',
      [internalId]
    );
    return rows[0]?.count || 0;
  }

  async getLinksByPageId(linkPageId: string): Promise<Link[]> {
    const [rows] = await pool.query<LinkRow[]>(
      'SELECT * FROM links WHERE link_page_id = ? ORDER BY `order`',
      [linkPageId]
    );
    return rows.map(mapLinkRow);
  }

  async getLink(id: string): Promise<Link | undefined> {
    const [rows] = await pool.query<LinkRow[]>(
      'SELECT * FROM links WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? mapLinkRow(rows[0]) : undefined;
  }

  async createLink(link: InsertLink): Promise<Link> {
    const existingLinks = await this.getLinksByPageId(link.linkPageId);
    const maxOrder = existingLinks.reduce((max, l) => Math.max(max, l.order || 0), -1);
    
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO links (link_page_id, title, url, icon, \`order\`, is_active, link_type, streaming_platform)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.linkPageId,
        link.title,
        link.url,
        link.icon || null,
        maxOrder + 1,
        link.isActive !== false ? 1 : 0,
        link.linkType || 'custom',
        link.streamingPlatform || null,
      ]
    );
    
    return (await this.getLink(String(result.insertId)))!;
  }

  async updateLink(id: string, link: Partial<InsertLink>): Promise<Link | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (link.title !== undefined) {
      updates.push('title = ?');
      values.push(link.title);
    }
    if (link.url !== undefined) {
      updates.push('url = ?');
      values.push(link.url);
    }
    if (link.icon !== undefined) {
      updates.push('icon = ?');
      values.push(link.icon);
    }
    if (link.order !== undefined) {
      updates.push('`order` = ?');
      values.push(link.order);
    }
    if (link.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(link.isActive ? 1 : 0);
    }
    if (link.linkType !== undefined) {
      updates.push('link_type = ?');
      values.push(link.linkType);
    }
    if (link.streamingPlatform !== undefined) {
      updates.push('streaming_platform = ?');
      values.push(link.streamingPlatform);
    }
    
    if (updates.length === 0) {
      return this.getLink(id);
    }
    
    values.push(id);
    await pool.query(
      `UPDATE links SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getLink(id);
  }

  async deleteLink(id: string): Promise<void> {
    await pool.query('DELETE FROM links WHERE id = ?', [id]);
  }

  async reorderLinks(linkPageId: string, linkIds: string[]): Promise<void> {
    for (let i = 0; i < linkIds.length; i++) {
      await pool.query(
        'UPDATE links SET `order` = ? WHERE id = ? AND link_page_id = ?',
        [i, linkIds[i], linkPageId]
      );
    }
  }

  async recordClick(
    linkId: string,
    linkPageId: string,
    metadata: { referrer?: string; userAgent?: string; country?: string }
  ): Promise<void> {
    await pool.query(
      'INSERT INTO link_clicks (link_id, link_page_id, referrer, user_agent, country) VALUES (?, ?, ?, ?, ?)',
      [linkId, linkPageId, metadata.referrer || null, metadata.userAgent || null, metadata.country || null]
    );
  }

  async getClickStats(linkPageId: string): Promise<{ totalClicks: number; clicksByLink: { linkId: string; clicks: number }[] }> {
    const [rows] = await pool.query<ClickStatsRow[]>(
      'SELECT link_id, COUNT(*) as clicks FROM link_clicks WHERE link_page_id = ? GROUP BY link_id',
      [linkPageId]
    );
    
    const clicksByLink = rows.map(row => ({
      linkId: String(row.link_id),
      clicks: row.clicks,
    }));
    
    const totalClicks = clicksByLink.reduce((sum, item) => sum + item.clicks, 0);
    
    return { totalClicks, clicksByLink };
  }

  async getTotalClicksByUserId(userId: string): Promise<number> {
    const userPages = await this.getLinkPagesByUserId(userId);
    if (userPages.length === 0) return 0;
    
    const pageIds = userPages.map(p => p.id);
    const placeholders = pageIds.map(() => '?').join(', ');
    
    const [rows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM link_clicks WHERE link_page_id IN (${placeholders})`,
      pageIds
    );
    
    return rows[0]?.count || 0;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    isSubscribed?: boolean;
  }): Promise<User | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (stripeInfo.stripeCustomerId !== undefined) {
      updates.push('stripe_customer_id = ?');
      values.push(stripeInfo.stripeCustomerId);
    }
    if (stripeInfo.stripeSubscriptionId !== undefined) {
      updates.push('stripe_subscription_id = ?');
      values.push(stripeInfo.stripeSubscriptionId);
    }
    if (stripeInfo.isSubscribed !== undefined) {
      updates.push('is_subscribed = ?');
      values.push(stripeInfo.isSubscribed ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return this.getUser(userId);
    }
    
    values.push(userId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE supabase_id = ?`,
      values
    );
    
    return this.getUser(userId);
  }

  async listProductsWithPrices(active = true) {
    const result = await db.execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = ${active}
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async getDomainByHostname(hostname: string): Promise<DomainMapping | undefined> {
    const [rows] = await pool.query<DomainMappingRow[]>(
      'SELECT * FROM domain_mappings WHERE hostname = ?',
      [hostname.toLowerCase()]
    );
    return rows.length > 0 ? mapDomainMappingRow(rows[0]) : undefined;
  }

  async getDomainsByPageId(linkPageId: string): Promise<DomainMapping[]> {
    const [rows] = await pool.query<DomainMappingRow[]>(
      'SELECT * FROM domain_mappings WHERE link_page_id = ? ORDER BY created_at',
      [linkPageId]
    );
    return rows.map(mapDomainMappingRow);
  }

  async getDomainById(id: string): Promise<DomainMapping | undefined> {
    const [rows] = await pool.query<DomainMappingRow[]>(
      'SELECT * FROM domain_mappings WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? mapDomainMappingRow(rows[0]) : undefined;
  }

  async createDomain(domain: InsertDomainMapping): Promise<DomainMapping> {
    const verificationToken = domain.verificationToken || `hubisck-verify-${crypto.randomUUID().slice(0, 8)}`;
    const verificationStatus = domain.domainType === 'subdomain' ? 'verified' : 'pending';
    
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO domain_mappings (link_page_id, domain_type, hostname, verification_status, verification_token)
       VALUES (?, ?, ?, ?, ?)`,
      [
        domain.linkPageId,
        domain.domainType,
        domain.hostname.toLowerCase(),
        verificationStatus,
        verificationToken,
      ]
    );
    
    return (await this.getDomainById(String(result.insertId)))!;
  }

  async updateDomainStatus(id: string, status: 'pending' | 'verifying' | 'verified' | 'failed'): Promise<DomainMapping | undefined> {
    await pool.query(
      'UPDATE domain_mappings SET verification_status = ?, last_checked_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.getDomainById(id);
  }

  async deleteDomain(id: string): Promise<void> {
    await pool.query('DELETE FROM domain_mappings WHERE id = ?', [id]);
  }

  async isHostnameAvailable(hostname: string): Promise<boolean> {
    const existing = await this.getDomainByHostname(hostname.toLowerCase());
    return !existing;
  }

  async getLinkPageByHostname(hostname: string): Promise<LinkPage | undefined> {
    const domain = await this.getDomainByHostname(hostname.toLowerCase());
    if (!domain || domain.verificationStatus !== 'verified') {
      return undefined;
    }
    return this.getLinkPageById(domain.linkPageId);
  }

  // Account-level custom domain methods
  async setUserCustomDomain(userId: string, domain: string, verificationToken: string): Promise<User> {
    await pool.query(
      `UPDATE users SET 
        custom_domain = ?, 
        custom_domain_verified = 0, 
        custom_domain_verified_at = NULL,
        custom_domain_verification_token = ?
       WHERE supabase_id = ?`,
      [domain.toLowerCase(), verificationToken, userId]
    );
    return (await this.getUser(userId))!;
  }

  async verifyUserCustomDomain(userId: string): Promise<User> {
    await pool.query(
      `UPDATE users SET 
        custom_domain_verified = 1, 
        custom_domain_verified_at = NOW()
       WHERE supabase_id = ?`,
      [userId]
    );
    return (await this.getUser(userId))!;
  }

  async removeUserCustomDomain(userId: string): Promise<User> {
    await pool.query(
      `UPDATE users SET 
        custom_domain = NULL, 
        custom_domain_verified = 0, 
        custom_domain_verified_at = NULL,
        custom_domain_verification_token = NULL
       WHERE supabase_id = ?`,
      [userId]
    );
    return (await this.getUser(userId))!;
  }

  async getUserByCustomDomain(domain: string): Promise<User | undefined> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE custom_domain = ? AND custom_domain_verified = 1',
      [domain.toLowerCase()]
    );
    return rows.length > 0 ? mapUserRow(rows[0]) : undefined;
  }

  async isCustomDomainAvailable(domain: string): Promise<boolean> {
    const [rows] = await pool.query<(RowDataPacket & { count: number })[]>(
      'SELECT COUNT(*) as count FROM users WHERE custom_domain = ?',
      [domain.toLowerCase()]
    );
    return rows[0].count === 0;
  }
}

export const storage = new MySQLStorage();
