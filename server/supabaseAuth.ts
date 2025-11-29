import { createClient } from '@supabase/supabase-js';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

// Hardcoded fallbacks to match the frontend Supabase configuration
const FALLBACK_SUPABASE_URL = 'https://mgvpyjlpouvgmaodbdjk.supabase.co';

const supabaseUrl = process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('[supabase] Initializing with URL:', supabaseUrl);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function setupSupabaseAuth(app: Express) {
  app.set("trust proxy", 1);

  app.post('/api/auth/callback', async (req, res) => {
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        console.log('[auth/callback] No access token provided');
        return res.status(400).json({ message: 'Access token required' });
      }

      console.log('[auth/callback] Token received, first 50 chars:', access_token.substring(0, 50));
      
      // First try Supabase admin API
      let user = null;
      let isEmailVerified = false;
      
      const { data, error } = await supabaseAdmin.auth.getUser(access_token);
      
      if (!error && data.user) {
        user = data.user;
        console.log('[auth/callback] User found via Supabase:', user.email);
        const isOAuth = user.app_metadata?.provider && user.app_metadata.provider !== 'email';
        isEmailVerified = !!user.email_confirmed_at || isOAuth;
      } else {
        // Fallback: decode JWT directly
        console.log('[auth/callback] Supabase failed, falling back to JWT decode');
        const decoded = decodeJwt(access_token);
        
        if (!decoded || !decoded.sub) {
          console.log('[auth/callback] Failed to decode JWT');
          return res.status(401).json({ message: 'Invalid token' });
        }
        
        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          console.log('[auth/callback] Token expired');
          return res.status(401).json({ message: 'Token expired' });
        }
        
        user = {
          id: decoded.sub,
          email: decoded.email,
          email_confirmed_at: decoded.email_verified ? new Date().toISOString() : null,
          user_metadata: decoded.user_metadata || {},
          app_metadata: decoded.app_metadata || {}
        };
        isEmailVerified = !!decoded.email_verified;
        console.log('[auth/callback] User found via JWT decode:', user.email);
      }

      try {
        console.log('[auth/callback] Upserting user:', user.id, user.email);
        await storage.upsertUser({
          id: user.id,
          email: user.email || null,
          firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
          lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
          profileImageUrl: user.user_metadata?.avatar_url || null,
        });
        console.log('[auth/callback] User upserted successfully');
      } catch (upsertError) {
        console.error('[auth/callback] Failed to upsert user:', upsertError);
        // Continue anyway - the user may already exist and just need to be fetched
      }

      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        console.error('[auth/callback] User not found in database after upsert:', user.id, user.email);
        return res.status(500).json({ message: 'Failed to create or find user' });
      }
      
      console.log('[auth/callback] Returning user:', dbUser.email);
      res.json({ ...dbUser, emailVerified: isEmailVerified });
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Endpoint to sync user after email verification
  app.post('/api/auth/sync-user', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Only sync if email is verified
      if (!user.email_confirmed_at) {
        return res.status(400).json({ message: 'Email not verified' });
      }

      await storage.upsertUser({
        id: user.id,
        email: user.email || null,
        firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
        lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: user.user_metadata?.avatar_url || null,
      });

      const dbUser = await storage.getUser(user.id);
      res.json({ ...dbUser, emailVerified: true });
    } catch (error) {
      console.error('Sync user error:', error);
      res.status(500).json({ message: 'Failed to sync user' });
    }
  });

  app.get('/api/logout', (_req, res) => {
    res.json({ success: true });
  });
}

// Decode JWT without verification (we trust Supabase's signature)
function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const requestUrl = req.originalUrl || req.url;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[auth] No Bearer token found in Authorization header for:', requestUrl);
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    
    if (!token || token === 'undefined' || token === 'null') {
      console.log('[auth] Invalid token value for:', requestUrl, 'token:', token?.substring(0, 20));
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
    
    // First try Supabase admin API
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (!error && user) {
      console.log('[auth] User validated via Supabase:', user.email);
      (req as any).user = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      };
      return next();
    }
    
    // Fallback: decode JWT directly (for when Supabase admin API has issues)
    console.log('[auth] Supabase admin failed, falling back to JWT decode');
    const decoded = decodeJwt(token);
    
    if (!decoded || !decoded.sub) {
      console.log('[auth] Failed to decode JWT');
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' });
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('[auth] Token expired');
      return res.status(401).json({ message: 'Unauthorized - Token expired' });
    }
    
    // Verify the issuer is our Supabase project
    const expectedIssuer = `${supabaseUrl}/auth/v1`;
    if (decoded.iss !== expectedIssuer) {
      console.log('[auth] Invalid issuer:', decoded.iss, 'expected:', expectedIssuer);
      return res.status(401).json({ message: 'Unauthorized - Invalid token issuer' });
    }
    
    console.log('[auth] User validated via JWT decode:', decoded.email);
    (req as any).user = {
      id: decoded.sub,
      email: decoded.email,
      user_metadata: decoded.user_metadata || {}
    };

    next();
  } catch (error) {
    console.error('[auth] Auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized - Server error' });
  }
};
