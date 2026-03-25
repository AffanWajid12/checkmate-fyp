import { AxiosError } from 'axios';
import { storage } from '../storage';
import { supabase } from '../supabase/client';
import { apiClient } from './config';
import {
    ApiError,
    GetCurrentUserResponse,
    LoginRequest,
    RegisterRequest,
} from './types';

/**
 * Authentication Service
 * - Login/logout are performed via Supabase.
 * - Backend user profile is fetched via GET /api/auth/me.
 */
class AuthService {
  /**
   * Register a new user (Supabase)
   */
  async register(data: RegisterRequest): Promise<void> {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user (Supabase)
   */
  async login(data: LoginRequest): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Fetch and store backend user shape { user }
      await this.getCurrentUser();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current authenticated user from backend
   * Backend response: 200 { user: <dbUser> }
   */
  async getCurrentUser(): Promise<GetCurrentUserResponse> {
    try {
      const response = await apiClient.get<{ user: GetCurrentUserResponse }>('/api/auth/me');

      const user = response.data.user;

      // Update stored user data
      await storage.setUser(user);

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user (Supabase)
   */
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear any legacy stored auth data
      await storage.clearAuth();
    }
  }

  /**
   * Check if user is authenticated (Supabase session)
   */
  async isAuthenticated(): Promise<boolean> {
    const { data, error } = await supabase.auth.getSession();
    if (error) return false;
    return !!data.session;
  }

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<any | null> {
    return await storage.getUser();
  }

  /**
   * Handle errors from axios/Supabase
   */
  private handleError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;

      if (apiError?.message) {
        return new Error(apiError.message);
      }

      if (error.response?.status === 401) {
        return new Error('Unauthorized. Please login again.');
      }

      if (error.response?.status === 400) {
        return new Error('Invalid input. Please check your data.');
      }

      if (error.response?.status && error.response.status >= 500) {
        return new Error('Server error. Please try again later.');
      }

      if (error.code === 'ECONNABORTED') {
        return new Error('Request timeout. Please check your connection.');
      }

      if (error.code === 'ERR_NETWORK') {
        return new Error('Network error. Please check your internet connection.');
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}

// Export singleton instance
export const authService = new AuthService();
