// ~/services/authService.ts
import axios from 'axios';

export interface LoginBody { email: string; password: string }
export interface LoginResponse { user: { id: string; name: string }; token: string }

export async function login(body: LoginBody): Promise<LoginResponse> {
  // Using axios to connect to external API with base URL from environment variables
  const baseURL = process.env.API_BASE_URL;
  const response = await axios.post(`${baseURL}/api/login`, body);
  return response.data;
}
