import { AxiosError } from 'axios';
import { storage } from '../storage';
import { apiClient } from './config';
import {
    ApiError,
    ApiResponse,
    GetCurrentUserResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse
} from './types';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * Register a new user
   * @param data Registration data (email, password, firstName, lastName, role, department)
   * @returns Promise with user data, access token, and refresh token
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>(
        '/api/auth/register',
        data
      );

      const { user, token, refreshToken } = response.data.data;

      // Save tokens and user data to storage
      await storage.setToken(token);
      await storage.setRefreshToken(refreshToken);
      await storage.setUser(user);

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user
   * @param data Login credentials (email, password)
   * @returns Promise with user data, access token, and refresh token
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        '/api/auth/login',
        data
      );

      const { user, token, refreshToken } = response.data.data;

      // Save tokens and user data to storage
      await storage.setToken(token);
      await storage.setRefreshToken(refreshToken);
      await storage.setUser(user);

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Refresh token
   * @returns Promise with new access token
   */
  async refreshToken(
    refreshToken: string
  ): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<
        ApiResponse<RefreshTokenResponse>
      >('/api/auth/refresh', { refreshToken });

      const { token } = response.data.data;

      // Save new access token
      await storage.setToken(token);

      return response.data.data;
    } catch (error) {
      // If refresh fails, clear all auth data
      await storage.clearAuth();
      throw this.handleError(error);
    }
  }

  /**
   * Get current authenticated user
   * @returns Promise with current user data
   */
  async getCurrentUser(): Promise<GetCurrentUserResponse> {
    try {
      const response = await apiClient.get<
        ApiResponse<GetCurrentUserResponse>
      >('/api/auth/me');

      const user = response.data.data;

      // Update stored user data
      await storage.setUser(user);

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   * Clears tokens from server and local storage
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Always clear local auth data
      await storage.clearAuth();
    }
  }

  /**
   * Check if user is authenticated
   * @returns Promise<boolean>
   */
  async isAuthenticated(): Promise<boolean> {
    return await storage.isAuthenticated();
  }

  /**
   * Get stored user data
   * @returns Promise with user data or null
   */
  async getStoredUser(): Promise<any | null> {
    return await storage.getUser();
  }

  /**
   * Handle API errors
   * @param error Axios error
   * @returns Formatted error object
   */
  private handleError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;
      
      if (apiError?.message) {
        return new Error(apiError.message);
      }

      if (error.response?.status === 401) {
        return new Error('Invalid credentials. Please try again.');
      }

      if (error.response?.status === 400) {
        return new Error('Invalid input. Please check your data.');
      }      if (error.response?.status === 409) {
        return new Error('Email already exists. Please use a different email.');
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

    return new Error('An unexpected error occurred. Please try again.');
  }
}

// Export singleton instance
export const authService = new AuthService();
