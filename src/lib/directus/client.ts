import { createDirectus, rest, authentication, readMe } from '@directus/sdk';

// Define the schema for user data from Directus
export interface DirectusUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
    admin_access: boolean;
    app_access: boolean;
  };
  status: string;
}

export interface DirectusSchema {
  directus_users: DirectusUser[];
}

// Create Directus client
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8070';

export const directus = createDirectus<DirectusSchema>(directusUrl)
  .with(rest())
  .with(authentication('json'));

// Authentication functions
export const directusAuth = {
  // Login function
  login: async (email: string, password: string) => {
    try {
      const result = await directus.login(email, password);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Directus login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  },

  // Logout function
  logout: async () => {
    try {
      await directus.logout();
      return { success: true };
    } catch (error: any) {
      console.error('Directus logout error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const user = await directus.request(
        readMe({
          fields: [
            'id',
            'email',
            'first_name',
            'last_name',
            'status',
            'role.id',
            'role.name',
            'role.description',
            'role.admin_access',
            'role.app_access'
          ]
        })
      );
      return { success: true, data: user };
    } catch (error: any) {
      console.error('Error getting current user:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user info'
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const user = await directus.request(readMe());
      return { success: true, authenticated: !!user };
    } catch (error) {
      return { success: true, authenticated: false };
    }
  },

  // Get token from storage (client-side)
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('directus_token');
    }
    return null;
  },

  // Set token in storage (client-side)
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('directus_token', token);
    }
  },

  // Remove token from storage (client-side)
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('directus_token');
    }
  }
};
