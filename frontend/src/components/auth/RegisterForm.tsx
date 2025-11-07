"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPublic } from "@/lib/api";
import { AxiosError } from "axios";
import { analytics } from "@/lib/analytics";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await apiPublic.post("/auth/register", {
        name,
        email,
        password,
      });

      analytics.trackFormSubmitted("register", true);
      router.push("/login");
    } catch (err) {
      setIsLoading(false);
      analytics.trackFormSubmitted("register", false);
      if (err instanceof AxiosError && err.response?.status === 409) {
        setError("Este e-mail já está em uso.");
      } else if (err instanceof AxiosError && err.response?.status === 400) {
        setError("Dados inválidos. Verifique os campos e tente novamente.");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Campo de Nome */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Nome
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Seu nome completo"
        />
      </div>

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
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          A senha deve ter no mínimo 8 caracteres.
        </p>
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
          {isLoading ? "Cadastrando..." : "Criar Conta"}
        </button>
      </div>

    </form>
  );
}
