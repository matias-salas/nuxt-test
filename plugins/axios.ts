// ~/plugins/axios.ts (ejemplo con $fetch)
export default defineNuxtPlugin((nuxtApp) => {
    const auth = useAuthStore()
  
    nuxtApp.$fetch = (orig) => {
      return async (url: string, opts: any = {}) => {
        if (auth.token) {
          opts.headers = {
            ...opts.headers,
            Authorization: `Bearer ${auth.token}`
          }
        }
        return orig(url, opts)
      }
    }
  })
  