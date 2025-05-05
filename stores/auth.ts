import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | { id: string; name: string },
    token: null as null | string,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
  },
  actions: {
    setUser(userData: { id: string; name: string }, jwt: string) {
      this.user = userData
      this.token = jwt
    },
    logout() {
      this.user = null
      this.token = null
    }
  }
})
