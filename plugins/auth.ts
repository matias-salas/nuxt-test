// plugins/auth.ts
import { useAuthStore } from '~/stores/auth'
import { jwtDecode } from 'jwt-decode'

export default defineNuxtPlugin({
  name: 'auth-plugin',
  // Este plugin puede ejecutarse en el cliente y en el servidor
  setup() {
    const authCookie = useCookie('auth-token')
    const auth = useAuthStore()
    
    // Si ya tenemos una cookie de auth pero no estado en Pinia
    if (authCookie.value && !auth.token) {
      try {
        // Decodificar el token para obtener la información del usuario
        const decodedToken = jwtDecode<{ user_id: number; email: string; exp: number }>(authCookie.value)
        
        // Verificar si el token ha expirado
        if (decodedToken.exp * 1000 > Date.now()) {
          // Establecer el estado de autenticación
          auth.$patch({
            token: authCookie.value,
            user: {
              id: decodedToken.user_id,
              email: decodedToken.email
            },
            expiresAt: decodedToken.exp
          })
          
          console.log('Sesión restaurada desde cookie')
        } else {
          console.log('Token en cookie expirado, eliminando')
          authCookie.value = null
        }
      } catch (error) {
        console.error('Error al decodificar token:', error)
        authCookie.value = null
      }
    }
  }
})