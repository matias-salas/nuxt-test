// ~/middleware/auth.global.ts
import { useAuthStore } from '~/stores/auth'
import { navigateTo, useRoute } from '#app'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  // Si la ruta no requiere auth, dejamos pasar
  if (!to.meta.requiresAuth) {
    return
  }

  // Si requiere auth y NO está logueado, redirigimos a login
  if (!auth.isLoggedIn) {
    return navigateTo({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Si está logueado, continúa normalmente
})
