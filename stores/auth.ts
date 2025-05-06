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
      
      // Guardar token en cookie para SSR
      const cookie = useCookie('auth-token', {
        maxAge: 60 * 60 * 24 * 7, // 7 días
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      cookie.value = token
    },
    logout() {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.expiresAt = null
      
      // Eliminar cookie al cerrar sesión
      const cookie = useCookie('auth-token')
      cookie.value = null
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
    },
    // Nuevo método para restaurar la sesión desde la cookie
    initFromCookie() {
      const cookie = useCookie('auth-token')
      
      if (cookie.value && !this.token) {
        try {
          // Validar el token de la cookie
          if (validateToken(cookie.value)) {
            this.token = cookie.value
            // Aquí podrías decodificar el token para obtener user_id, email, etc.
            // o hacer una petición al backend para obtener los datos del usuario
          } else {
            this.logout()
          }
        } catch (error) {
          console.error('Error al inicializar desde cookie:', error)
          this.logout()
        }
      }
    }
  },
  persist: {
    storage: process.client ? localStorage : undefined
  }
})
