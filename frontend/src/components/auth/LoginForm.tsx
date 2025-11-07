"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { apiPublic } from "@/lib/api";
import { AxiosError } from "axios";
import { analytics } from "@/lib/analytics";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiPublic.post("/auth/login", {
        email,
        password,
      }, {
        withCredentials: true, // Garantir que cookies sejam recebidos
      });

      // Tokens agora estão em cookies httpOnly, não precisamos armazenar
      const { user } = response.data;

      // Armazenar apenas informações do usuário (não o token)
      login("", user); // Token vazio, pois está em cookie
      analytics.trackFormSubmitted("login", true);

      router.push("/dashboard");
    } catch (err) {
      setIsLoading(false);
      analytics.trackFormSubmitted("login", false);
      if (err instanceof AxiosError && err.response?.status === 401) {
        setError("E-mail ou senha inválidos.");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Campo de E-mail */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="seu@email.com"
        />
      </div>

      {/* Campo de Senha */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="••••••••"
        />
      </div>

      {/* Exibição de Erro */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Botão de Submit */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-slate-100 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </div>

    </form>
  );
}
