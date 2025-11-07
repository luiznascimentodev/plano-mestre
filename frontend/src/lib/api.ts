import axios from "axios";

// Base URL da API - usar variável de ambiente em produção
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiPublic = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  withCredentials: true, // Enviar cookies automaticamente
});

export const apiPrivate = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  withCredentials: true, // Enviar cookies automaticamente
});

import { useAuthStore } from "../store/auth.store";

apiPrivate.interceptors.request.use(
  (config) => {
    // Cookies são enviados automaticamente pelo navegador
    // Não precisamos adicionar manualmente se estiverem em httpOnly cookies
    // Mas mantemos fallback para header Authorization se necessário
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Garantir que cookies sejam enviados
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta para tratar erros de autenticação e refresh de tokens
apiPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se receber 401 (não autorizado) e não for uma tentativa de refresh
    // E não for o endpoint /auth/me (para evitar loop)
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/logout") &&
      !originalRequest.url?.includes("/auth/me")
    ) {
      originalRequest._retry = true;

      try {
        // Tentar renovar o token usando refresh token
        await apiPublic.post("/auth/refresh", {}, { withCredentials: true });
        
        // Retentar a requisição original
        return apiPrivate(originalRequest);
      } catch (refreshError) {
        // Se o refresh falhar, apenas rejeitar o erro
        // O componente que chamou deve lidar com o redirecionamento
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
