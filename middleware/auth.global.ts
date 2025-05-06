// ~/middleware/auth.global.ts
import { useAuthStore } from '~/stores/auth'
import { navigateTo, useRoute } from '#app'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  
  // Check if token is valid
  const isValid = auth.checkAuth()
  console.log('Auth middleware:', {
    route: to.path,
    requiresAuth: to.meta.requiresAuth,
    isLoggedIn: auth.isLoggedIn,
    tokenIsValid: isValid
  })
  
  // Si la ruta no requiere auth, dejamos pasar
  if (!to.meta.requiresAuth) {
    return
  }

  // Si requiere auth y NO está logueado, redirigimos a login
  if (!auth.isLoggedIn) {
    console.log('Redirecting to login, user not logged in')
    return navigateTo({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Si está logueado, continúa normalmente
  console.log('User is authenticated, proceeding to', to.path)
})
