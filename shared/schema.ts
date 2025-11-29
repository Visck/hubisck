import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Supabase Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isSubscribed: boolean("is_subscribed").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Page types for different use cases
export type PageType = 'standard' | 'smart-link';

// Social media links structure for pages
export type SocialMediaLinks = {
  facebook?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  custom?: string;
};

// Link pages - users can have multiple link pages
export const linkPages = pgTable("link_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  backgroundColor: varchar("background_color").default("#FF6600"),
  textColor: varchar("text_color").default("#FFFFFF"),
  gtmContainerId: varchar("gtm_container_id"), // Google Tag Manager container ID (format: GTM-XXXXXXX)
  // Page type: 'standard' or 'smart-link'
  pageType: varchar("page_type").default("standard"),
  artistName: varchar("artist_name"), // Used for smart-link pages
  releaseDate: varchar("release_date"),
  coverArtUrl: varchar("cover_art_url"),
  // Artist page specific
  upcomingEvents: text("upcoming_events"), // JSON string for events
  merchandiseUrl: varchar("merchandise_url"),
  // New musician mode fields
  websiteUrl: varchar("website_url"),
  socialLinks: jsonb("social_links").$type<SocialMediaLinks>(), // Facebook, YouTube, Instagram, TikTok, Custom
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLinkPageSchema = createInsertSchema(linkPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLinkPage = z.infer<typeof insertLinkPageSchema>;
export type LinkPage = typeof linkPages.$inferSelect;

// Streaming platform types for musician pages
export type StreamingPlatform = 
  | 'spotify' 
  | 'soundcloud' 
  | 'youtube' 
  | 'netease' 
  | 'deezer' 
  | 'apple_music' 
  | 'tidal' 
  | 'amazon_music'
  | 'custom';

// Link types
export type LinkType = 'social' | 'website' | 'streaming' | 'custom';

// Individual links within a link page
export const links = pgTable("links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkPageId: varchar("link_page_id").notNull().references(() => linkPages.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  url: varchar("url").notNull(),
  icon: varchar("icon"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  // Link categorization
  linkType: varchar("link_type").default("custom"), // 'social', 'website', 'streaming', 'custom'
  streamingPlatform: varchar("streaming_platform"), // For streaming links: 'spotify', 'youtube', etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Link = typeof links.$inferSelect;

// Click analytics
export const linkClicks = pgTable("link_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  linkPageId: varchar("link_page_id").notNull().references(() => linkPages.id, { onDelete: "cascade" }),
  clickedAt: timestamp("clicked_at").defaultNow(),
  referrer: varchar("referrer"),
  userAgent: varchar("user_agent"),
  country: varchar("country"),
});

export type LinkClick = typeof linkClicks.$inferSelect;
