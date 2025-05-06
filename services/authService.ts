// authService.ts

import axios from 'axios';
import { useRuntimeConfig } from '#app';
import { jwtDecode } from 'jwt-decode';

// Don't call useRuntimeConfig here at the module level
// Instead, create a function that gets the API URL when needed

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface UserData {
  user_id: number;
  email: string;
}

export const login = async (credentials: { email: string; password: string }) => {
  try {
    // Get the config inside the function
    const config = useRuntimeConfig();
    const apiUrl = `${config.public.apiBaseUrl}/users/token/`;
    console.log('API URL:', apiUrl);
    console.log('Credentials:', credentials);
    
    const response = await axios.post<AuthResponse>(apiUrl, credentials);
    const authData = response.data;
    console.log('Auth data:', authData);
    // Decode the access token to get user information
    const decodedToken = jwtDecode<UserData & { exp: number }>(authData.access);
    console.log('Decoded token:', decodedToken);
    
    return {
      token: authData.access,
      refreshToken: authData.refresh,
      user: {
        id: decodedToken.user_id,
        email: decodedToken.email
      },
      expiresAt: decodedToken.exp
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      throw new Error(error.response.data.detail || error.response.data.message || 'Error de autenticación');
    }
    throw new Error('Error de conexión al servidor');
  }
};

// Agregar un método para verificar el token
export const validateToken = (token: string): boolean => {
  if (!token) return false;
  
  try {
    const decodedToken = jwtDecode<{ exp: number }>(token);
    // Convertir la fecha de expiración a milisegundos y comparar con la fecha actual
    return decodedToken.exp * 1000 > Date.now();
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};