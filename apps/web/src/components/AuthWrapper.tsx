import React, { useState, useEffect } from 'react';
import { Auth } from '../lib/auth';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, shows sign-in screen when not authenticated
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, requireAuth = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const user = await Auth.waitForAuth();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 flex items-center justify-center">
            <img
              src="/log.png"
              alt="BuyFaster Logo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-gray-900 mb-4">Welcome to BuyFaster</h2>
          
          <Button
            onClick={() => Auth.signInWithGoogle()}
            variant="gradient"
            className="w-full mb-4 flex items-center justify-center text-sm sm:text-base py-2.5 sm:py-3"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
          
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  // Return children with auth context
  return <>{children}</>;
};

// Hook to use authentication state
export const useAuth = () => {
  const [authUser, setAuthUser] = useState(Auth.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(Auth.isAuthenticated());

  useEffect(() => {
    const checkAuth = async () => {
      const user = await Auth.waitForAuth();
      setAuthUser(user);
      setIsAuthenticated(!!user);
    };

    checkAuth();
  }, []);

  return {
    user: authUser,
    isAuthenticated,
    signIn: Auth.signInWithGoogle,
    signOut: Auth.signOut,
  };
};

export default AuthWrapper;
