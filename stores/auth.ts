// ~/stores/auth.ts
import { defineStore } from 'pinia'
import { login as apiLogin, validateToken } from '~/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | { id: number; email: string },
    token: null as null | string,
    refreshToken: null as null | string,
    expiresAt: null as null | number
  }),
  getters: {
    isLoggedIn: (state) => {
      return !!state.token && state.checkAuth()
    }
  },
  actions: {
    async login(email: string, password: string) {
      const { user, token, refreshToken, expiresAt } = await apiLogin({ email, password })
      this.user = user
      this.token = token
      this.refreshToken = refreshToken
      this.expiresAt = expiresAt
    },
    logout() {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.expiresAt = null
    },
    checkAuth() {
      if (!this.token) return false
      
      // Check if token is expired
      if (this.expiresAt) {
        // Ensure we're comparing timestamps in the same format (milliseconds)
        const expiryTime = this.expiresAt * 1000;
        const now = Date.now();
        
        console.log('Token expiry check:', { 
          expiryTime, 
          now, 
          isExpired: expiryTime <= now 
        });
        
        if (expiryTime <= now) {
          console.log('Token expired, logging out');
          this.logout()
          return false
        }
      }
      
      return true
    }
  },
  persist: true
})
