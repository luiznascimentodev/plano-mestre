"use client";

import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import { analytics } from "@/lib/analytics";
import { useEffect } from "react";

export default function RegisterPage() {
  useEffect(() => {
    analytics.trackPageView("/cadastro", "Cadastro");
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 px-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-4 shadow-sm">
            <span className="text-white font-bold text-2xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Crie sua conta</h1>
          <p className="text-slate-600 dark:text-slate-400">Comece a organizar seus estudos hoje mesmo</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 transition-colors">
          <RegisterForm />

          {/* Link para login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
