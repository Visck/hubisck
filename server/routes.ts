import type { Express } from "express";
import express from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupSupabaseAuth, isAuthenticated } from "./supabaseAuth";
import { insertLinkPageSchema, insertLinkSchema } from "@shared/schema";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import multer from "multer";
import path from "path";
import fs from "fs";
import SpotifyWebApi from "spotify-web-api-node";

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 500 * 1024, // 500KB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

type Currency = 'BRL' | 'EUR' | 'USD';

interface GeoLocationResponse {
  currency: Currency;
  country_code: string;
}

const countryToCurrency: Record<string, Currency> = {
  BR: 'BRL',
  PT: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  GR: 'EUR',
  FI: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  CY: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupSupabaseAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Geolocation for currency detection
  app.get('/api/geolocation', async (req, res) => {
    try {
      const forwardedFor = req.headers['x-forwarded-for'];
      const clientIp = typeof forwardedFor === 'string' 
        ? forwardedFor.split(',')[0].trim()
        : req.socket.remoteAddress || '';

      const isLocalIp = clientIp === '127.0.0.1' || 
                        clientIp === '::1' || 
                        clientIp.startsWith('192.168.') ||
                        clientIp.startsWith('10.') ||
                        clientIp === '';

      if (isLocalIp) {
        return res.json({ currency: 'USD', country_code: 'US' } as GeoLocationResponse);
      }

      const response = await fetch(`https://ipapi.co/${clientIp}/json/`);
      
      if (!response.ok) {
        return res.json({ currency: 'USD', country_code: 'US' } as GeoLocationResponse);
      }

      const data = await response.json() as { country_code?: string };
      const countryCode = data.country_code || 'US';
      const currency = countryToCurrency[countryCode] || 'USD';

      res.json({ currency, country_code: countryCode } as GeoLocationResponse);
    } catch (error) {
      console.error('Geolocation error:', error);
      res.json({ currency: 'USD', country_code: 'US' } as GeoLocationResponse);
    }
  });

  // Debug endpoint to test authentication in production
  app.get('/api/debug/session', async (req, res) => {
    const authHeader = req.headers.authorization;
    const hasAuthHeader = !!authHeader;
    const hasBearerPrefix = authHeader?.startsWith('Bearer ') || false;
    const tokenLength = authHeader ? authHeader.length - 7 : 0;
    
    console.log('[debug/session] Auth header present:', hasAuthHeader);
    console.log('[debug/session] Bearer prefix:', hasBearerPrefix);
    console.log('[debug/session] Token length:', tokenLength);
    console.log('[debug/session] Origin:', req.headers.origin);
    console.log('[debug/session] Host:', req.headers.host);
    
    res.json({
      authenticated: hasAuthHeader && hasBearerPrefix && tokenLength > 0,
      hasAuthHeader,
      hasBearerPrefix,
      tokenLength,
      origin: req.headers.origin || null,
      host: req.headers.host || null,
      env: process.env.NODE_ENV || 'development',
    });
  });

  // Image upload endpoint
  app.post('/api/upload', isAuthenticated, imageUpload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Return the URL to access the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Serve uploaded files using Express.static for security
  // Express.static prevents directory traversal attacks
  app.use('/uploads', express.static(uploadDir));

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const pages = await storage.getLinkPagesByUserId(userId);
      const totalClicks = await storage.getTotalClicksByUserId(userId);
      
      res.json({
        totalPages: pages.length,
        totalClicks,
        isSubscribed: user?.isSubscribed || false,
        subscription: user?.stripeSubscriptionId ? {
          id: user.stripeSubscriptionId,
          status: user.isSubscribed ? 'active' : 'inactive'
        } : null
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Link page routes - support multiple pages per user
  app.get('/api/link-pages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const pages = await storage.getLinkPagesByUserId(userId);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching link pages:", error);
      res.status(500).json({ message: "Failed to fetch link pages" });
    }
  });

  // For backward compatibility - get first page
  app.get('/api/link-page', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const page = await storage.getLinkPageByUserId(userId);
      res.json(page || null);
    } catch (error) {
      console.error("Error fetching link page:", error);
      res.status(500).json({ message: "Failed to fetch link page" });
    }
  });

  // Get specific page by ID
  app.get('/api/link-pages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const page = await storage.getLinkPageById(id);
      
      if (!page || page.userId !== userId) {
        return res.status(404).json({ message: "Page not found" });
      }
      
      res.json(page);
    } catch (error) {
      console.error("Error fetching link page:", error);
      res.status(500).json({ message: "Failed to fetch link page" });
    }
  });

  app.post('/api/link-page', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const parsedData = insertLinkPageSchema.parse({ ...req.body, userId });
      
      // Check if slug is available
      const slugExists = await storage.getLinkPageBySlug(parsedData.slug);
      if (slugExists) {
        return res.status(400).json({ message: "This URL is already taken" });
      }

      // Validate GTM Container ID format if provided
      let gtmContainerId = parsedData.gtmContainerId;
      if (gtmContainerId && gtmContainerId.trim() !== '') {
        const gtmId = gtmContainerId.trim();
        if (!/^GTM-[A-Z0-9]{4,12}$/i.test(gtmId)) {
          return res.status(400).json({ message: "Invalid GTM Container ID format. Must be GTM-XXXXXXX" });
        }
        gtmContainerId = gtmId.toUpperCase();
      }

      const data: import('./storage').InsertLinkPage = {
        userId: parsedData.userId,
        slug: parsedData.slug,
        title: parsedData.title,
        bio: parsedData.bio,
        avatarUrl: parsedData.avatarUrl,
        backgroundColor: parsedData.backgroundColor,
        textColor: parsedData.textColor,
        gtmContainerId,
        pageType: parsedData.pageType,
        artistName: parsedData.artistName,
        releaseDate: parsedData.releaseDate,
        coverArtUrl: parsedData.coverArtUrl,
        upcomingEvents: parsedData.upcomingEvents,
        merchandiseUrl: parsedData.merchandiseUrl,
        websiteUrl: parsedData.websiteUrl,
        socialLinks: parsedData.socialLinks as import('./storage').SocialMediaLinks | null | undefined,
      };

      const page = await storage.createLinkPage(data);

      // Create links from website URL and social media links
      const linksToCreate: Array<{ title: string; url: string; linkType: string; icon?: string; order: number }> = [];
      let order = 0;

      // Add website link
      if (req.body.websiteUrl) {
        linksToCreate.push({
          title: 'Website',
          url: req.body.websiteUrl,
          linkType: 'website',
          icon: 'globe',
          order: order++,
        });
      }

      // Add social media links
      const socialLinks = req.body.socialLinks || {};
      
      if (socialLinks.facebook) {
        linksToCreate.push({
          title: 'Facebook',
          url: socialLinks.facebook,
          linkType: 'social',
          icon: 'facebook',
          order: order++,
        });
      }
      
      if (socialLinks.youtube) {
        linksToCreate.push({
          title: 'YouTube',
          url: socialLinks.youtube,
          linkType: 'social',
          icon: 'youtube',
          order: order++,
        });
      }
      
      if (socialLinks.instagram) {
        linksToCreate.push({
          title: 'Instagram',
          url: socialLinks.instagram,
          linkType: 'social',
          icon: 'instagram',
          order: order++,
        });
      }
      
      if (socialLinks.tiktok) {
        linksToCreate.push({
          title: 'TikTok',
          url: socialLinks.tiktok,
          linkType: 'social',
          icon: 'tiktok',
          order: order++,
        });
      }
      
      if (socialLinks.custom) {
        linksToCreate.push({
          title: 'Link',
          url: socialLinks.custom,
          linkType: 'custom',
          icon: 'link',
          order: order++,
        });
      }

      // Create all links for this page
      for (const linkData of linksToCreate) {
        await storage.createLink({
          linkPageId: page.id,
          ...linkData,
        });
      }

      res.json(page);
    } catch (error) {
      console.error("Error creating link page:", error);
      res.status(500).json({ message: "Failed to create link page" });
    }
  });

  app.patch('/api/link-page/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      // Verify ownership
      const existingPage = await storage.getLinkPageById(id);
      if (!existingPage || existingPage.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Check slug availability if changing
      if (req.body.slug && req.body.slug !== existingPage.slug) {
        const slugExists = await storage.getLinkPageBySlug(req.body.slug);
        if (slugExists) {
          return res.status(400).json({ message: "This URL is already taken" });
        }
      }

      // Validate GTM Container ID format if provided
      if (req.body.gtmContainerId && req.body.gtmContainerId.trim() !== '') {
        const gtmId = req.body.gtmContainerId.trim();
        if (!/^GTM-[A-Z0-9]{4,12}$/i.test(gtmId)) {
          return res.status(400).json({ message: "Invalid GTM Container ID format. Must be GTM-XXXXXXX" });
        }
        req.body.gtmContainerId = gtmId.toUpperCase(); // Normalize to uppercase
      }

      const page = await storage.updateLinkPage(id, req.body);
      res.json(page);
    } catch (error) {
      console.error("Error updating link page:", error);
      res.status(500).json({ message: "Failed to update link page" });
    }
  });

  // Delete a link page
  app.delete('/api/link-page/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      // Verify ownership
      const existingPage = await storage.getLinkPageById(id);
      if (!existingPage || existingPage.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteLinkPage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting link page:", error);
      res.status(500).json({ message: "Failed to delete link page" });
    }
  });

  // Links routes
  app.get('/api/links', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { pageId } = req.query;
      
      if (pageId) {
        // Get links for specific page
        const page = await storage.getLinkPageById(pageId as string);
        if (!page || page.userId !== userId) {
          return res.status(404).json({ message: "Page not found" });
        }
        const linksList = await storage.getLinksByPageId(pageId as string);
        return res.json(linksList);
      }
      
      // Fallback: get first page's links for backward compatibility
      const page = await storage.getLinkPageByUserId(userId);
      if (!page) {
        return res.json([]);
      }
      const linksList = await storage.getLinksByPageId(page.id);
      res.json(linksList);
    } catch (error) {
      console.error("Error fetching links:", error);
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });

  app.post('/api/links', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { linkPageId } = req.body;
      
      let pageId = linkPageId;
      if (!pageId) {
        // Fallback: use first page for backward compatibility
        const page = await storage.getLinkPageByUserId(userId);
        if (!page) {
          return res.status(400).json({ message: "Create a link page first" });
        }
        pageId = page.id;
      } else {
        // Verify ownership
        const page = await storage.getLinkPageById(pageId);
        if (!page || page.userId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }

      const data = insertLinkSchema.parse({ ...req.body, linkPageId: pageId });
      const link = await storage.createLink(data);
      res.json(link);
    } catch (error) {
      console.error("Error creating link:", error);
      res.status(500).json({ message: "Failed to create link" });
    }
  });

  app.patch('/api/links/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      // Get the link first
      const link = await storage.getLink(id);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      
      // Verify the link's page belongs to this user
      const page = await storage.getLinkPageById(link.linkPageId);
      if (!page || page.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateLink(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating link:", error);
      res.status(500).json({ message: "Failed to update link" });
    }
  });

  app.delete('/api/links/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      // Get the link first
      const link = await storage.getLink(id);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      
      // Verify the link's page belongs to this user
      const page = await storage.getLinkPageById(link.linkPageId);
      if (!page || page.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteLink(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting link:", error);
      res.status(500).json({ message: "Failed to delete link" });
    }
  });

  app.post('/api/links/reorder', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { linkIds } = req.body;
      
      const page = await storage.getLinkPageByUserId(userId);
      if (!page) {
        return res.status(400).json({ message: "No link page found" });
      }

      await storage.reorderLinks(page.id, linkIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering links:", error);
      res.status(500).json({ message: "Failed to reorder links" });
    }
  });

  // Public link page view
  app.get('/api/p/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const page = await storage.getLinkPageBySlug(slug);
      
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }

      const linksList = await storage.getLinksByPageId(page.id);
      res.json({ page, links: linksList.filter(l => l.isActive) });
    } catch (error) {
      console.error("Error fetching public page:", error);
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  // Click tracking
  app.post('/api/click/:linkId', async (req, res) => {
    try {
      const { linkId } = req.params;
      const link = await storage.getLink(linkId);
      
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      await storage.recordClick(linkId, link.linkPageId, {
        referrer: req.headers.referer,
        userAgent: req.headers['user-agent'],
        country: req.headers['cf-ipcountry'] as string,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error recording click:", error);
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  // Analytics
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const page = await storage.getLinkPageByUserId(userId);
      
      if (!page) {
        return res.json({ totalClicks: 0, clicksByLink: [] });
      }

      const stats = await storage.getClickStats(page.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Track Detection API - Spotify Only
  app.post('/api/detect-track', isAuthenticated, async (req: any, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Extract Spotify track ID from various URL formats
      const spotifyTrackRegex = /(?:spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]+)/;
      const spotifyAlbumRegex = /(?:spotify\.com\/album\/|spotify:album:)([a-zA-Z0-9]+)/;
      
      const trackMatch = url.match(spotifyTrackRegex);
      const albumMatch = url.match(spotifyAlbumRegex);
      
      if (!trackMatch && !albumMatch) {
        return res.status(400).json({ 
          message: "Please enter a valid Spotify track or album URL" 
        });
      }

      // Initialize Spotify API
      const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
      const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!spotifyClientId || !spotifyClientSecret) {
        return res.status(500).json({ 
          message: "Spotify API credentials not configured. Please contact support." 
        });
      }

      const spotifyApi = new SpotifyWebApi({
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
      });

      // Get access token using client credentials flow
      const authResponse = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(authResponse.body.access_token);

      let trackInfo: {
        title: string;
        artistName: string;
        coverArtUrl: string;
        isrc?: string;
        releaseDate?: string;
        albumName?: string;
      };

      if (trackMatch) {
        // Get track info
        const trackId = trackMatch[1];
        const trackResponse = await spotifyApi.getTrack(trackId);
        const track = trackResponse.body;

        trackInfo = {
          title: track.name,
          artistName: track.artists.map(a => a.name).join(', '),
          coverArtUrl: track.album.images[0]?.url || '',
          isrc: track.external_ids?.isrc,
          releaseDate: track.album.release_date,
          albumName: track.album.name,
        };
      } else {
        // Get album info (use first track for ISRC)
        const albumId = albumMatch![1];
        const albumResponse = await spotifyApi.getAlbum(albumId);
        const album = albumResponse.body;

        // Get first track's ISRC
        let isrc: string | undefined;
        if (album.tracks.items.length > 0) {
          const firstTrackId = album.tracks.items[0].id;
          const trackResponse = await spotifyApi.getTrack(firstTrackId);
          isrc = trackResponse.body.external_ids?.isrc;
        }

        trackInfo = {
          title: album.name,
          artistName: album.artists.map(a => a.name).join(', '),
          coverArtUrl: album.images[0]?.url || '',
          isrc,
          releaseDate: album.release_date,
          albumName: album.name,
        };
      }

      // Initialize streaming links with Spotify
      const streamingLinks: Record<string, string> = {
        spotify: url,
      };

      res.json({
        success: true,
        track: {
          title: trackInfo.title,
          artistName: trackInfo.artistName,
          coverArtUrl: trackInfo.coverArtUrl,
          releaseDate: trackInfo.releaseDate,
          albumName: trackInfo.albumName,
          isrc: trackInfo.isrc,
        },
        streamingLinks,
        platformCount: 1,
        message: 'Found your track on Spotify! Add other platform links manually.',
      });
    } catch (error: any) {
      console.error("Track detection error:", error);
      
      // Normalize error messages for user-friendly display
      if (error.statusCode === 404) {
        return res.status(404).json({ message: "Track not found on Spotify" });
      }
      
      if (error.statusCode === 401 || error.statusCode === 403) {
        return res.status(500).json({ 
          message: "Unable to connect to Spotify. Please try again later." 
        });
      }
      
      // Sanitize error message - don't expose raw API errors
      let userMessage = "Failed to detect track. Please try again.";
      if (error.message?.includes('ENOTFOUND') || error.message?.includes('ETIMEDOUT')) {
        userMessage = "Connection error. Please check your internet and try again.";
      }
      
      res.status(500).json({ message: userMessage });
    }
  });

  // Stripe routes
  app.get('/api/stripe/publishable-key', async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error fetching publishable key:", error);
      res.status(500).json({ message: "Failed to fetch Stripe key" });
    }
  });

  app.get('/api/products', async (_req, res) => {
    try {
      const rows = await storage.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null, isSubscribed: user?.isSubscribed || false });
      }

      const subscription = await storage.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription, isSubscribed: user.isSubscribed || false });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(
          user.email || `${userId}@hubisck.app`,
          userId
        );
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/dashboard?checkout=success`,
        `${baseUrl}/dashboard?checkout=cancelled`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post('/api/customer-portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // ============ Account-Level Custom Domain Routes ============
  
  // Get current custom domain status for the account
  app.get('/api/account/domains/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        customDomain: user.customDomain,
        customDomainVerified: user.customDomainVerified,
        customDomainVerifiedAt: user.customDomainVerifiedAt,
        verificationToken: user.customDomainVerificationToken,
      });
    } catch (error) {
      console.error("Error fetching domain status:", error);
      res.status(500).json({ message: "Failed to fetch domain status" });
    }
  });

  // Connect a custom domain to the account
  app.post('/api/account/domains/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { domain } = req.body;
      
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ message: "Domain is required" });
      }
      
      // Normalize and validate domain format
      const normalizedDomain = domain
        .toLowerCase()
        .trim()
        .replace(/^https?:\/\//, '')  // Remove protocol
        .replace(/\/$/, '')            // Remove trailing slash
        .replace(/[^\x00-\x7F]/g, '')  // Remove non-ASCII (Unicode homoglyphs)
        .replace(/\s+/g, '');          // Remove whitespace
      
      // Length validation (max 253 chars for full domain name)
      if (normalizedDomain.length > 253 || normalizedDomain.length < 4) {
        return res.status(400).json({ message: "Domain must be between 4 and 253 characters" });
      }
      
      // Basic domain validation - ASCII only, proper format
      const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
      if (!domainRegex.test(normalizedDomain)) {
        return res.status(400).json({ message: "Invalid domain format. Example: mysite.com" });
      }
      
      // Each label (part between dots) must be max 63 chars
      const labels = normalizedDomain.split('.');
      if (labels.some(label => label.length > 63)) {
        return res.status(400).json({ message: "Each part of the domain must be 63 characters or less" });
      }
      
      // Block hubisck.com subdomains
      if (normalizedDomain.endsWith('.hubisck.com') || normalizedDomain === 'hubisck.com') {
        return res.status(400).json({ message: "Cannot use hubisck.com domains as custom domains" });
      }
      
      // Check if domain is already in use by another account
      const isAvailable = await storage.isCustomDomainAvailable(normalizedDomain);
      if (!isAvailable) {
        // Check if it's our own domain
        const user = await storage.getUser(userId);
        if (user?.customDomain !== normalizedDomain) {
          return res.status(400).json({ message: "This domain is already in use by another account" });
        }
      }
      
      // Generate verification token
      const verificationToken = `hubisck-verify-${crypto.randomUUID().slice(0, 12)}`;
      
      // Save domain with pending verification
      const updatedUser = await storage.setUserCustomDomain(userId, normalizedDomain, verificationToken);
      
      // Determine DNS instructions based on domain type
      const isRootDomain = normalizedDomain.split('.').length === 2; // e.g., mysite.com vs subdomain.mysite.com
      
      res.json({
        success: true,
        domain: normalizedDomain,
        verified: false,
        verificationToken,
        dnsRecords: {
          txtRecord: {
            type: 'TXT',
            host: `_hubisck-verify.${normalizedDomain}`,
            value: verificationToken,
            description: 'Required for domain verification',
          },
          cnameRecord: isRootDomain ? null : {
            type: 'CNAME',
            host: normalizedDomain,
            value: 'hubisck.com',
            description: 'Points your domain to Hubisck',
          },
          aRecord: isRootDomain ? {
            type: 'A',
            host: '@',
            value: '76.76.21.21', // Vercel's IP for root domains
            description: 'Required for root domains',
          } : null,
        },
        instructions: isRootDomain
          ? 'Add the TXT record for verification, then add the A record to point your domain to Hubisck.'
          : 'Add the TXT record for verification, then add the CNAME record to point your domain to Hubisck.',
      });
    } catch (error) {
      console.error("Error connecting domain:", error);
      res.status(500).json({ message: "Failed to connect domain" });
    }
  });

  // Verify the custom domain
  app.post('/api/account/domains/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.customDomain) {
        return res.status(400).json({ message: "No custom domain configured" });
      }
      
      if (user.customDomainVerified) {
        return res.json({
          success: true,
          verified: true,
          domain: user.customDomain,
          message: "Domain is already verified",
        });
      }
      
      // Check TXT record
      const dns = await import('dns').then(m => m.promises);
      const txtHost = `_hubisck-verify.${user.customDomain}`;
      
      let txtRecordFound = false;
      try {
        const records = await dns.resolveTxt(txtHost);
        const flatRecords = records.map(r => r.join('')).map(r => r.trim());
        txtRecordFound = flatRecords.includes(user.customDomainVerificationToken || '');
      } catch (dnsError: any) {
        if (dnsError.code !== 'ENODATA' && dnsError.code !== 'ENOTFOUND') {
          console.error("DNS TXT lookup error:", dnsError);
        }
      }
      
      if (!txtRecordFound) {
        return res.json({
          success: false,
          verified: false,
          domain: user.customDomain,
          message: `TXT record not found. Add a TXT record at _hubisck-verify.${user.customDomain} with value: ${user.customDomainVerificationToken}`,
        });
      }
      
      // Check if domain points to Hubisck (CNAME or A record)
      let domainPointsCorrectly = false;
      const isRootDomain = user.customDomain.split('.').length === 2;
      
      try {
        if (isRootDomain) {
          // Check A record for root domains
          const aRecords = await dns.resolve4(user.customDomain);
          domainPointsCorrectly = aRecords.includes('76.76.21.21');
        } else {
          // Check CNAME for subdomains
          const cnameRecords = await dns.resolveCname(user.customDomain);
          domainPointsCorrectly = cnameRecords.some(r => 
            r.toLowerCase() === 'hubisck.com' || r.toLowerCase().endsWith('.hubisck.com')
          );
        }
      } catch (dnsError: any) {
        // For root domains, also try to resolve and check if it works
        if (dnsError.code !== 'ENODATA' && dnsError.code !== 'ENOTFOUND') {
          console.error("DNS lookup error:", dnsError);
        }
      }
      
      if (!domainPointsCorrectly) {
        return res.json({
          success: false,
          verified: false,
          txtVerified: true,
          domain: user.customDomain,
          message: isRootDomain
            ? `Domain DNS not configured. Add an A record pointing to 76.76.21.21`
            : `Domain DNS not configured. Add a CNAME record pointing to hubisck.com`,
        });
      }
      
      // All checks passed - mark as verified
      const updatedUser = await storage.verifyUserCustomDomain(userId);
      
      res.json({
        success: true,
        verified: true,
        domain: user.customDomain,
        message: "Domain verified successfully! Your pages are now accessible at your custom domain.",
      });
    } catch (error) {
      console.error("Error verifying domain:", error);
      res.status(500).json({ message: "Failed to verify domain" });
    }
  });

  // Remove the custom domain from the account
  app.delete('/api/account/domains/remove', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.customDomain) {
        return res.status(400).json({ message: "No custom domain configured" });
      }
      
      await storage.removeUserCustomDomain(userId);
      
      res.json({
        success: true,
        message: "Custom domain removed successfully",
      });
    } catch (error) {
      console.error("Error removing domain:", error);
      res.status(500).json({ message: "Failed to remove domain" });
    }
  });

  // ============ Legacy Per-Page Domain Routes (Deprecated) ============

  // Get all domains for a specific page
  app.get('/api/domains/:pageId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { pageId } = req.params;
      
      // Verify page ownership - CRITICAL SECURITY CHECK
      const page = await storage.getLinkPageById(pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      if (page.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this page's domains" });
      }
      
      const domains = await storage.getDomainsByPageId(pageId);
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  // Check hostname availability
  app.get('/api/domains/check/:hostname', isAuthenticated, async (req: any, res) => {
    try {
      const { hostname } = req.params;
      const isAvailable = await storage.isHostnameAvailable(hostname.toLowerCase());
      res.json({ available: isAvailable, hostname: hostname.toLowerCase() });
    } catch (error) {
      console.error("Error checking hostname:", error);
      res.status(500).json({ message: "Failed to check hostname" });
    }
  });

  // Reserved subdomains that cannot be claimed - comprehensive list
  const RESERVED_SUBDOMAINS = [
    // Infrastructure & DNS
    'www', 'www1', 'www2', 'ns', 'ns1', 'ns2', 'ns3', 'ns4', 'dns', 'dns1', 'dns2',
    'mx', 'mx1', 'mx2', 'mx3', 'mail', 'mail1', 'mail2', 'smtp', 'imap', 'pop', 'pop3',
    'webmail', 'email', 'ftp', 'ftp1', 'ftp2', 'sftp', 'ssh', 'vpn', 'proxy',
    // Admin & Backend
    'admin', 'administrator', 'api', 'api1', 'api2', 'app', 'backend', 'server',
    'cpanel', 'whm', 'panel', 'plesk', 'control', 'manage', 'manager',
    // Authentication & Security
    'auth', 'oauth', 'login', 'signup', 'register', 'logout', 'sso', 'saml',
    'account', 'accounts', 'user', 'users', 'profile', 'profiles', 'me',
    'password', 'reset', 'verify', 'confirm', 'secure', 'security', 'ssl',
    // Content & Media
    'cdn', 'cdn1', 'cdn2', 'cdn3', 'static', 'assets', 'media', 'images', 'img',
    'files', 'uploads', 'download', 'downloads', 'video', 'videos', 'audio',
    // Business & Payments
    'billing', 'pay', 'payment', 'payments', 'checkout', 'stripe', 'paypal',
    'invoice', 'invoices', 'subscription', 'subscribe', 'pricing', 'price',
    // Hubisck Brand
    'hubisck', 'hub', 'link', 'links', 'page', 'pages', 'smart', 'smartlink',
    'smartlinks', 'bio', 'linktree', 'about', 'info', 'contact',
    // Development & Testing
    'test', 'testing', 'demo', 'staging', 'stage', 'dev', 'development',
    'prod', 'production', 'beta', 'alpha', 'preview', 'sandbox', 'local', 'localhost',
    // Support & Communication
    'help', 'support', 'docs', 'documentation', 'faq', 'feedback', 'tickets',
    'blog', 'news', 'updates', 'changelog', 'status', 'uptime',
    // Common / Reserved
    'home', 'dashboard', 'settings', 'config', 'configuration', 'root', 'system',
    'internal', 'private', 'public', 'autodiscover', 'autoconfig', 'wpad',
    // Generic words that could cause confusion
    'music', 'artist', 'artists', 'track', 'tracks', 'album', 'albums', 'spotify',
  ];
  
  // Helper to check if subdomain matches reserved patterns (including numeric variants)
  const isReservedSubdomain = (subdomain: string): boolean => {
    const normalized = subdomain.toLowerCase();
    
    // Direct match
    if (RESERVED_SUBDOMAINS.includes(normalized)) {
      return true;
    }
    
    // Check for numeric variants (e.g., cdn1, cdn2, mail01, etc.)
    const numericPattern = /^(.+?)(\d+)$/;
    const match = normalized.match(numericPattern);
    if (match) {
      const baseName = match[1];
      if (RESERVED_SUBDOMAINS.includes(baseName)) {
        return true;
      }
    }
    
    return false;
  };

  // Create a free subdomain (username.hubisck.com)
  app.post('/api/domains/subdomain', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { pageId, subdomain } = req.body;
      
      if (!pageId || !subdomain) {
        return res.status(400).json({ message: "Page ID and subdomain are required" });
      }
      
      // Normalize subdomain to lowercase
      const normalizedSubdomain = subdomain.toLowerCase().trim();
      
      // Validate subdomain format (alphanumeric, hyphens, 3-30 chars)
      const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
      if (!subdomainRegex.test(normalizedSubdomain)) {
        return res.status(400).json({ 
          message: "Subdomain must be 3-30 characters, alphanumeric with hyphens (not at start/end)" 
        });
      }
      
      // Block reserved subdomains (including numeric variants)
      if (isReservedSubdomain(normalizedSubdomain)) {
        return res.status(400).json({ message: "This subdomain is reserved and cannot be claimed" });
      }
      
      // Verify page ownership - CRITICAL SECURITY CHECK
      const page = await storage.getLinkPageById(pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      if (page.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage this page" });
      }
      
      const hostname = `${normalizedSubdomain}.hubisck.com`;
      
      // Check availability
      const isAvailable = await storage.isHostnameAvailable(hostname);
      if (!isAvailable) {
        return res.status(400).json({ message: "This subdomain is already taken" });
      }
      
      // Create the subdomain (auto-verified for subdomains)
      const domain = await storage.createDomain({
        linkPageId: pageId,
        domainType: 'subdomain',
        hostname,
      });
      
      res.json(domain);
    } catch (error) {
      console.error("Error creating subdomain:", error);
      res.status(500).json({ message: "Failed to create subdomain" });
    }
  });

  // Add a custom domain
  app.post('/api/domains/custom', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { pageId, hostname } = req.body;
      
      if (!pageId || !hostname) {
        return res.status(400).json({ message: "Page ID and hostname are required" });
      }
      
      // Validate domain format
      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
      if (!domainRegex.test(hostname)) {
        return res.status(400).json({ message: "Invalid domain format" });
      }
      
      // Block hubisck.com domains from custom domain flow
      if (hostname.toLowerCase().endsWith('.hubisck.com') || hostname.toLowerCase() === 'hubisck.com') {
        return res.status(400).json({ message: "Use the subdomain option for hubisck.com domains" });
      }
      
      // Verify page ownership - CRITICAL SECURITY CHECK
      const page = await storage.getLinkPageById(pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      if (page.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage this page" });
      }
      
      // Check availability
      const isAvailable = await storage.isHostnameAvailable(hostname.toLowerCase());
      if (!isAvailable) {
        return res.status(400).json({ message: "This domain is already connected to another page" });
      }
      
      // Create the custom domain (needs verification)
      const domain = await storage.createDomain({
        linkPageId: pageId,
        domainType: 'custom',
        hostname: hostname.toLowerCase(),
      });
      
      // Get deployment URL for DNS instructions
      const deploymentUrl = req.get('host') || 'hubisck.com';
      
      res.json({
        domain,
        dnsInstructions: {
          cnameRecord: {
            type: 'CNAME',
            name: '@',
            value: deploymentUrl,
            ttl: 'Auto or 3600',
          },
          txtRecord: {
            type: 'TXT',
            name: '_hubisck-verify',
            value: domain.verificationToken,
            ttl: 'Auto or 3600',
          },
        },
      });
    } catch (error) {
      console.error("Error creating custom domain:", error);
      res.status(500).json({ message: "Failed to add custom domain" });
    }
  });

  // Verify a custom domain
  app.post('/api/domains/:domainId/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { domainId } = req.params;
      
      // Get domain
      const domain = await storage.getDomainById(domainId);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      // Verify page ownership - CRITICAL SECURITY CHECK
      const page = await storage.getLinkPageById(domain.linkPageId);
      if (!page) {
        return res.status(404).json({ message: "Associated page not found" });
      }
      if (page.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage this domain" });
      }
      
      // Already verified
      if (domain.verificationStatus === 'verified') {
        return res.json({ verified: true, domain });
      }
      
      // Mark as verifying
      await storage.updateDomainStatus(domainId, 'verifying');
      
      // Try DNS verification using TXT record
      const dns = await import('dns').then(m => m.promises);
      let verified = false;
      
      try {
        const txtRecords = await dns.resolveTxt(`_hubisck-verify.${domain.hostname}`);
        for (const record of txtRecords) {
          const value = record.join('');
          if (value === domain.verificationToken) {
            verified = true;
            break;
          }
        }
      } catch (dnsError: any) {
        // TXT record not found or DNS error
        console.log(`DNS verification failed for ${domain.hostname}:`, dnsError.code);
      }
      
      // Also try CNAME verification as fallback
      if (!verified) {
        try {
          const cnameRecords = await dns.resolveCname(domain.hostname);
          // Accept any CNAME pointing to our deployment
          const deploymentUrl = req.get('host') || 'hubisck.com';
          for (const cname of cnameRecords) {
            if (cname.includes('replit') || cname.includes('hubisck')) {
              verified = true;
              break;
            }
          }
        } catch (cnameError: any) {
          // CNAME not found
          console.log(`CNAME verification failed for ${domain.hostname}:`, cnameError.code);
        }
      }
      
      // Update status
      const newStatus = verified ? 'verified' : 'failed';
      const updatedDomain = await storage.updateDomainStatus(domainId, newStatus);
      
      res.json({ 
        verified, 
        domain: updatedDomain,
        message: verified 
          ? 'Domain verified successfully!' 
          : 'Verification failed. Please check your DNS records and try again.'
      });
    } catch (error) {
      console.error("Error verifying domain:", error);
      res.status(500).json({ message: "Failed to verify domain" });
    }
  });

  // Delete a domain
  app.delete('/api/domains/:domainId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { domainId } = req.params;
      
      // Get domain
      const domain = await storage.getDomainById(domainId);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      // Verify page ownership - CRITICAL SECURITY CHECK
      const page = await storage.getLinkPageById(domain.linkPageId);
      if (!page) {
        return res.status(404).json({ message: "Associated page not found" });
      }
      if (page.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage this domain" });
      }
      
      await storage.deleteDomain(domainId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting domain:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  // Public: Lookup page by custom domain/subdomain
  app.get('/api/domain-lookup', async (req, res) => {
    try {
      const hostname = req.query.hostname as string;
      
      if (!hostname) {
        return res.status(400).json({ message: "Hostname is required" });
      }
      
      const page = await storage.getLinkPageByHostname(hostname.toLowerCase());
      
      if (!page) {
        return res.status(404).json({ 
          message: "This domain is not connected to any Hubisck page yet.",
          notConnected: true 
        });
      }
      
      const linksList = await storage.getLinksByPageId(page.id);
      res.json({ page, links: linksList.filter(l => l.isActive) });
    } catch (error) {
      console.error("Error looking up domain:", error);
      res.status(500).json({ message: "Failed to lookup domain" });
    }
  });

  return httpServer;
}
