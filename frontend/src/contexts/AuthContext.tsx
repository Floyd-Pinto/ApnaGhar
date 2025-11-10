import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, User, LoginRequest, RegisterRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateRole: (role: 'buyer' | 'builder') => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthContext: Initializing authentication...');
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken && refreshToken) {
        console.log('AuthContext: Found tokens, fetching user profile...');
        try {
          // Try to get user profile with 5 second timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          );
          
          const userData = await Promise.race([
            authAPI.getProfile(),
            timeoutPromise
          ]) as User;
          
          console.log('AuthContext: User profile fetched successfully');
          setUser(userData);
        } catch (error) {
          console.error('AuthContext: Profile fetch failed', error);
          // If profile fetch fails, clear tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      } else {
        console.log('AuthContext: No tokens, skipping profile fetch');
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials);
      
      // Store tokens
      localStorage.setItem('access_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      await authAPI.register(userData);
      
      // After registration, automatically log in
      await login({
        username_or_email: userData.username,
        password: userData.password,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const refreshTokens = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authAPI.refresh(refreshToken);
      localStorage.setItem('access_token', response.access);
      
      // Get updated user profile
      const userData = await authAPI.getProfile();
      setUser(userData);
    } catch (error) {
      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      throw error;
    }
  };

  const updateRole = async (role: 'buyer' | 'builder') => {
    try {
      await authAPI.updateRole(role);
      // Refresh user profile to get updated role
      await refreshUserProfile();
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken: refreshTokens,
    updateRole,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};