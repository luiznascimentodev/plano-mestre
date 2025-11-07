"use client";

import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import { analytics } from "@/lib/analytics";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const hasCheckedRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    analytics.trackPageView("/login", "Login");
    
    // Verificar autenticação apenas uma vez após o mount
    if (!hasCheckedRef.current && !hasRedirectedRef.current) {
      hasCheckedRef.current = true;
      // Aguardar um tick para garantir que o Zustand carregou do localStorage
      const checkAuth = setTimeout(() => {
        if (hasRedirectedRef.current) return;
        const { token } = useAuthStore.getState();
        if (token) {
          hasRedirectedRef.current = true;
          router.replace("/dashboard");
        }
      }, 100);
      
      return () => clearTimeout(checkAuth);
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 px-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-4 shadow-sm">
            <span className="text-white font-bold text-2xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Bem-vindo de volta</h1>
          <p className="text-slate-600 dark:text-slate-400">Entre na sua conta para continuar estudando</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 transition-colors">
          <LoginForm />

          {/* Link para cadastro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Não tem uma conta?{" "}
              <Link
                href="/cadastro"
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

