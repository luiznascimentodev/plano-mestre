import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null; // Mantido para compatibilidade, mas não usado mais
  user: User | null;
  login: (token: string, user: User | null) => void;
  logout: () => Promise<void>;
  isLoggedIn: () => boolean;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: (token, user) => {
        set({ token, user });
      },

      clear: () => {
        set({ token: null, user: null });
      },

      logout: async () => {
        // Limpar o store primeiro (não bloquear UI)
        set({ token: null, user: null });
        
        // Tentar chamar endpoint de logout em background (não bloquear)
        // Usar setTimeout para não bloquear a UI
        setTimeout(async () => {
          try {
            const { apiPublic } = await import("../lib/api");
            await apiPublic.post("/auth/logout", {}, { withCredentials: true }).catch(() => {
              // Ignorar erros - pode já estar deslogado ou endpoint não disponível
            });
          } catch (error) {
            // Ignorar erros no logout (pode já estar deslogado)
          }
        }, 0);
      },

      isLoggedIn: () => {
        // Verificar se temos usuário (token está em cookie httpOnly)
        return !!get().user;
      },
    }),
    {
      name: "plano-mestre-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
