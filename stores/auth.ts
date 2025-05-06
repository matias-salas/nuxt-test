// ~/stores/auth.ts
import { defineStore } from 'pinia'
import { login as apiLogin } from '~/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | { id: string; name: string },
    token: null as null | string
  }),
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    async login(email: string, password: string) {
      const { user, token } = await apiLogin({ email, password })
      this.user = user
      this.token = token
    },
    logout() {
      this.user = null
      this.token = null
    }
  }
})
