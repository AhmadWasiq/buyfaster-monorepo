// Real authentication system using Supabase Google Auth
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

class Auth {
  private static authUser: AuthUser | null = null;
  private static session: Session | null = null;
  private static readonly STORAGE_KEY = 'buyfaster_auth';

  // Initialize authentication listener
  static init() {
    // Check for stored auth state first
    this.loadStoredAuth();

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 Auth event: ${event}`);
      this.session = session;

      if (session?.user) {
        this.authUser = this.createAuthUserFromSupabase(session.user);
        this.saveAuthState();
        console.log(`✅ User authenticated: ${this.authUser.email}`);
      } else {
        this.authUser = null;
        this.clearStoredAuth();
        console.log('🔓 User signed out');
      }
    });

    // Get initial session
    this.getSession();
  }

  // Get current session
  static async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    this.session = session;
    
    if (session?.user) {
      this.authUser = this.createAuthUserFromSupabase(session.user);
    }
    
    return session;
  }

  // Convert Supabase user to our AuthUser format
  private static createAuthUserFromSupabase(user: User): AuthUser {
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
    const nameParts = fullName.split(' ');
    
    return {
      id: user.id,
      email: user.email || '',
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      avatar_url: user.user_metadata?.avatar_url
    };
  }
  
  // Get current authenticated user
  static getCurrentUser(): AuthUser | null {
    return this.authUser;
  }
  
  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.authUser !== null && this.session !== null;
  }
  
  // Get user ID for database operations
  static getUserId(): string | null {
    return this.authUser?.id || null;
  }
  
  // Get user email for database operations
  static getUserEmail(): string | null {
    return this.authUser?.email || null;
  }

  // Get Supabase session
  static getSupabaseSession(): Session | null {
    return this.session;
  }

  // Save authentication state to localStorage
  private static saveAuthState() {
    if (this.authUser && this.session) {
      const authState = {
        user: this.authUser,
        session: {
          access_token: this.session.access_token,
          refresh_token: this.session.refresh_token,
          expires_at: this.session.expires_at,
        },
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authState));
    }
  }

  // Load authentication state from localStorage
  private static loadStoredAuth() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const authState = JSON.parse(stored);
        // Check if stored auth is not too old (24 hours)
        const age = Date.now() - (authState.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge && authState.user) {
          this.authUser = authState.user;
          console.log(`📱 Loaded stored auth for: ${this.authUser?.email || 'unknown'}`);
        } else {
          // Clear expired auth
          this.clearStoredAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      this.clearStoredAuth();
    }
  }

  // Clear stored authentication state
  private static clearStoredAuth() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  // Sign in with Google
  static async signInWithGoogle(): Promise<{ error?: any }> {
    console.log('🚀 Initiating Google sign in...');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) {
      console.error('❌ Google sign in error:', error);
      return { error };
    }
    
    return {};
  }
  
  // Sign out
  static async signOut(): Promise<{ error?: any }> {
    console.log('🔓 Signing out...');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Sign out error:', error);
      return { error };
    }

    this.authUser = null;
    this.session = null;
    this.clearStoredAuth();

    return {};
  }

  // Wait for authentication to be ready
  static async waitForAuth(): Promise<AuthUser | null> {
    // If already authenticated, return immediately
    if (this.authUser) {
      return this.authUser;
    }

    // Wait for session to be loaded
    await this.getSession();
    return this.authUser;
  }

  // Get or create user profile in our users table
  static async getOrCreateUserProfile(): Promise<any> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    // We'll handle user profile creation in the components that need it
    // This avoids circular dependency issues
    return user;
  }
}

// Initialize auth system
Auth.init();

export { Auth, type AuthUser };
export default Auth;
