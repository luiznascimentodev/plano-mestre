"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { apiPrivate, apiPublic } from "@/lib/api";

interface Topic {
  id: number;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED";
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  description?: string;
  tags?: string;
  color?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const hasCheckedRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const fetchTopics = async () => {
    try {
      const response = await apiPrivate.get("/topics");
      setTopics(response.data);
    } catch (err: any) {
      // Se for 401, não logar erro aqui (já será tratado pela verificação de auth)
      // Apenas logar outros erros
      if (err.response?.status !== 401) {
        console.error("Erro ao carregar assuntos:", err);
      }
      // Não definir topics vazio para não perder dados já carregados
    }
  };

  useEffect(() => {
    setIsMounted(true);
    
    // Verificar autenticação apenas uma vez
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      
      // Verificar primeiro se já temos usuário no store (após login bem-sucedido)
      const { user: storedUser } = useAuthStore.getState();
      
      if (storedUser) {
        // Se já temos usuário no store, permitir renderizar imediatamente
        // e fazer verificação em background
        setAuthChecked(true);
        fetchTopics();
        
        // Verificar autenticação em background para sincronizar
        const verifyInBackground = async () => {
          try {
            const response = await apiPrivate.get("/auth/me");
            if (response.data && response.data.id) {
              // Atualizar store com dados mais recentes
              useAuthStore.getState().login("", response.data);
            }
          } catch (error: any) {
            // Se falhar com 401, tentar refresh token apenas se não for 404
            if (error.response?.status === 401) {
              try {
                await apiPublic.post("/auth/refresh", {}, { withCredentials: true });
                // Se refresh funcionar, tentar novamente
                const retryResponse = await apiPrivate.get("/auth/me");
                if (retryResponse.data && retryResponse.data.id) {
                  useAuthStore.getState().login("", retryResponse.data);
                }
              } catch (refreshError: any) {
                // Se refresh falhar (404, 401, etc.), verificar se ainda temos usuário no store
                // Se tiver, manter logado (pode ser problema temporário de rede)
                // Se não tiver, redirecionar para login
                const { user } = useAuthStore.getState();
                if (!user) {
                  console.error("Erro ao verificar autenticação:", refreshError);
                  useAuthStore.getState().clear();
                  if (!hasRedirectedRef.current) {
                    hasRedirectedRef.current = true;
                    router.replace("/login");
                  }
                } else {
                  // Se ainda temos usuário no store, apenas logar o erro mas manter logado
                  console.warn("Erro ao verificar autenticação em background, mas mantendo usuário logado:", refreshError?.response?.status || refreshError?.message);
                }
              }
            } else {
              // Outros erros (404, 500, etc.) - apenas logar, não deslogar
              console.warn("Erro ao verificar autenticação em background:", error?.response?.status || error?.message);
            }
          }
        };
        
        // Executar verificação em background após um pequeno delay
        setTimeout(verifyInBackground, 100);
        return;
      }
      
      // Se não temos usuário no store, fazer verificação completa
      // Timeout de segurança - sempre definir authChecked após 3 segundos
      const safetyTimeout = setTimeout(() => {
        setAuthChecked(true);
        const { user } = useAuthStore.getState();
        if (!user && !hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          router.replace("/login");
        }
      }, 3000);
      
      // Função para verificar autenticação
      const checkAuth = async () => {
        try {
          // Tentar verificar via API (cookie httpOnly)
          const response = await apiPrivate.get("/auth/me");
          
          clearTimeout(safetyTimeout);
          
          if (response.data && response.data.id) {
            // Se tiver dados do usuário, atualizar store e buscar tópicos
            useAuthStore.getState().login("", response.data);
            setAuthChecked(true);
            await fetchTopics();
            return;
          }
        } catch (error: any) {
          // Se der erro 401, tentar refresh token antes de desistir
          if (error.response?.status === 401) {
            try {
              await apiPublic.post("/auth/refresh", {}, { withCredentials: true });
              // Se refresh funcionar, tentar novamente
              const retryResponse = await apiPrivate.get("/auth/me");
              if (retryResponse.data && retryResponse.data.id) {
                clearTimeout(safetyTimeout);
                useAuthStore.getState().login("", retryResponse.data);
                setAuthChecked(true);
                await fetchTopics();
                return;
              }
            } catch (refreshError: any) {
              // Se refresh falhar (404, 401, etc.), não está autenticado
              clearTimeout(safetyTimeout);
              setAuthChecked(true);
              useAuthStore.getState().clear();
              
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                router.replace("/login");
              }
              return;
            }
          } else {
            // Outros erros (404, 500, etc.) - não está autenticado
            clearTimeout(safetyTimeout);
            setAuthChecked(true);
            useAuthStore.getState().clear();
            
            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              router.replace("/login");
            }
            return;
          }
        }
      };
      
      // Verificar autenticação após um pequeno delay
      const timeout = setTimeout(checkAuth, 100);
      
      return () => {
        clearTimeout(timeout);
        clearTimeout(safetyTimeout);
      };
    }
  }, [router]);

  // Aguardar montagem e verificação de autenticação
  if (!isMounted || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado após verificação, não renderizar (já redirecionou)
  const { user } = useAuthStore.getState();
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar topics={topics} onTopicCreated={fetchTopics} />
      <div className="flex-1 flex flex-col ml-72 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors">{children}</main>
      </div>
    </div>
  );
}
