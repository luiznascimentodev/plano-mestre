"use client";

import { useState } from "react";
import { apiPrivate } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import { useAuthStore } from "@/store/auth.store";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect } from "react";

export default function SuggestionsPage() {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analytics.trackPageView("/dashboard/suggestions", "Sugestões");
    analytics.trackFeatureAccessed("suggestions_page");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      await apiPrivate.post("/suggestions", {
        subject: subject.trim(),
        message: message.trim(),
      });

      analytics.trackFormSubmitted("suggestion", true);
      setIsSuccess(true);
      setSubject("");
      setMessage("");

      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err: any) {
      analytics.trackFormSubmitted("suggestion", false);
      setError(
        err.response?.data?.message ||
          "Erro ao enviar sugestão. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Sugestões e Feedback
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
          Sua opinião é muito importante! Envie sugestões, reporte problemas ou
          compartilhe ideias para melhorarmos o Plano Mestre.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Enviar Sugestão
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sua mensagem será enviada diretamente para nossa equipe
            </p>
          </div>
        </div>

        {/* Success Message */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-900 dark:text-emerald-300">
                Sugestão enviada com sucesso!
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Obrigado pelo seu feedback. Vamos analisar sua sugestão e
                considerá-la para futuras melhorias.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-300">Erro ao enviar</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Enviando como:</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{user?.name || "Usuário"}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>

          {/* Subject Field */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Assunto <span className="text-red-500">*</span>
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Sugestão de nova funcionalidade, Reportar bug, Melhoria na interface..."
              required
              maxLength={200}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {subject.length}/200 caracteres
            </p>
          </div>

          {/* Message Field */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Mensagem <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva sua sugestão, feedback ou problema em detalhes. Quanto mais informações, melhor conseguiremos entender e implementar sua ideia!"
              required
              rows={10}
              maxLength={2000}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {message.length}/2000 caracteres
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sua sugestão será enviada para nossa equipe de desenvolvimento
            </p>
            <button
              type="submit"
              disabled={isLoading || !subject.trim() || !message.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-slate-100 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-semibold"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Enviar Sugestão
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Suas ideias importam
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Cada sugestão é analisada pela nossa equipe e considerada para
            futuras melhorias na plataforma.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Resposta rápida
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Nossa equipe revisa todas as sugestões regularmente e trabalha para
            implementar as melhores ideias.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Melhorias contínuas
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Suas sugestões ajudam a tornar o Plano Mestre ainda melhor para
            todos os estudantes.
          </p>
        </div>
      </div>
    </div>
  );
}

