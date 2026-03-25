import { API_BASE_URL, apiClient } from './config';

/**
 * API Testing Utilities
 * Use these to test if your backend is reachable
 */
export const apiTestUtils = {
  /**
   * Test if the API server is reachable
   * @returns Promise with connection status
   */
  async testConnection(): Promise<{
    connected: boolean;
    message: string;
    baseURL: string;
  }> {
    try {
      console.log('🔍 Testing API connection...');
      console.log('📍 Base URL:', API_BASE_URL);

      // Try to reach the API (you can add a health check endpoint)
      const response = await apiClient.get('/', {
        timeout: 5000,
      });

      console.log('✅ API Connection successful!');
      return {
        connected: true,
        message: 'API server is reachable',
        baseURL: API_BASE_URL,
      };
    } catch (error: any) {
      console.error('❌ API Connection failed:', error.message);
      
      if (error.code === 'ERR_NETWORK') {
        return {
          connected: false,
          message: `Cannot reach API at ${API_BASE_URL}. Check if:\n1. Backend server is running\n2. Correct IP address/port\n3. Firewall settings`,
          baseURL: API_BASE_URL,
        };
      }

      if (error.code === 'ECONNABORTED') {
        return {
          connected: false,
          message: 'Connection timeout. Server may be slow or unreachable.',
          baseURL: API_BASE_URL,
        };
      }

      return {
        connected: false,
        message: error.message || 'Unknown connection error',
        baseURL: API_BASE_URL,
      };
    }
  },

  /**
   * Test login endpoint directly
   * @param email Test email
   * @param password Test password
   */
  async testLogin(
    email: string = 'test@example.com',
    password: string = 'password123'
  ): Promise<void> {
    try {
      console.log('🔍 Testing Login Endpoint...');
      console.log('📍 POST', `${API_BASE_URL}/api/auth/login`);
      console.log('📦 Payload:', { email, password: '***' });

      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      console.log('✅ Login endpoint works!');
      console.log('📨 Response:', response.data);
    } catch (error: any) {
      console.error('❌ Login endpoint error:', error.response?.data || error.message);
    }
  },

  /**
   * Test register endpoint directly
   */
  async testRegister(): Promise<void> {
    const testData = {
      email: `test${Date.now()}@example.com`,
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'professor' as const,
    };

    try {
      console.log('🔍 Testing Register Endpoint...');
      console.log('📍 POST', `${API_BASE_URL}/api/auth/register`);
      console.log('📦 Payload:', { ...testData, password: '***' });

      const response = await apiClient.post('/api/auth/register', testData);

      console.log('✅ Register endpoint works!');
      console.log('📨 Response:', response.data);
    } catch (error: any) {
      console.error('❌ Register endpoint error:', error.response?.data || error.message);
    }
  },

  /**
   * Log current configuration
   */
  logConfig(): void {
    console.log('⚙️ API Configuration:');
    console.log('  Base URL:', API_BASE_URL);
    console.log('  Timeout:', '30000ms');
    console.log('  Environment:', __DEV__ ? 'Development' : 'Production');
    console.log('\n💡 Tip: If using Android Emulator, use http://10.0.2.2:PORT');
    console.log('💡 Tip: If using physical device, use your computer\'s IP address');
  },
};
