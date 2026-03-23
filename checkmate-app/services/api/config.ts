import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSupabaseAccessToken } from '../supabase/authToken';

// Base API URL - Update this with your actual backend URL
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.11:5000' // Development
  : 'https://api.checkmate.edu'; // Production

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add Supabase JWT to requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Log outgoing request
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
    });

    const token = await getSupabaseAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Supabase access token added to request');
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - log responses (no refresh-token flow)
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    // Log error response
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export { API_BASE_URL, apiClient };

