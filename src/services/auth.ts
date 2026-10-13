/**
 * Moonlit Jewelry - Authentication Layer
 * Persists admin access per device in localStorage until explicit logout.
 */

const STORAGE_TOKEN_KEY = 'moonlit_admin_device_auth_token';
export const ADMIN_PASSWORD = 'moonlit123';

export const authService = {
  async login(password: string): Promise<{ success: boolean; message: string }> {
    if (password.trim() === ADMIN_PASSWORD) {
      const token = `mjs_${Date.now()}`;
      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
      } catch (e) {}
      try {
        sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
      } catch (e) {}
      return { success: true, message: 'approved' };
    }
    return { success: false, message: 'Password mismatch' };
  },

  isAuthenticated(): boolean {
    try {
      const localToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (localToken && localToken.startsWith('mjs_')) return true;
      const sessionToken = sessionStorage.getItem(STORAGE_TOKEN_KEY);
      if (sessionToken && sessionToken.startsWith('mjs_')) return true;
    } catch (e) {}
    return false;
  },

  logout(): void {
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch (e) {}
    try {
      sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch (e) {}
  }
};
