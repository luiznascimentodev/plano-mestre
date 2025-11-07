"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import {
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  FireIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  TrophyIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { analytics } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import "@/styles/landing-animations.css";

export default function HomePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const authCheckedRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    analytics.trackPageView("/", "Página Inicial");
    analytics.trackFeatureAccessed("landing_page");
  }, []);

  useEffect(() => {
    if (!isMounted || authCheckedRef.current || hasRedirectedRef.current) return;
    
    // Verificar autenticação apenas uma vez
    authCheckedRef.current = true;
    const checkAuth = setTimeout(() => {
      if (hasRedirectedRef.current) return;
      const { token, user } = useAuthStore.getState();
      if (token && user) {
        hasRedirectedRef.current = true;
        router.replace("/dashboard");
      }
    }, 150);

    return () => clearTimeout(checkAuth);
  }, [isMounted, router]);

  const handleGetStarted = () => {
    analytics.trackButtonClick("get_started", "landing_page");
    router.push("/cadastro");
  };

  const handleLogin = () => {
    analytics.trackButtonClick("login", "landing_page");
    router.push("/login");
  };

  const features = [
    {
      icon: ClockIcon,
      title: "Técnica Pomodoro",
      description:
        "Timer Pomodoro integrado para estudar com foco total. Ideal para programadores estudando algoritmos, concurseiros revisando matérias ou qualquer pessoa que precisa de concentração profunda.",
      color: "emerald",
    },
    {
      icon: BookOpenIcon,
      title: "Flashcards Inteligentes",
      description:
        "Sistema de flashcards com repetição espaçada cientificamente comprovada. Perfeito para memorizar sintaxes, leis, fórmulas ou qualquer conteúdo.",
      color: "blue",
    },
    {
      icon: CalendarIcon,
      title: "Planejamento Inteligente",
      description:
        "Agende suas sessões de estudo, organize assuntos por categoria e nunca mais perca uma revisão importante.",
      color: "purple",
    },
    {
      icon: FireIcon,
      title: "Sistema de Hábitos",
      description:
        "Crie e acompanhe hábitos de estudo personalizados. Construa a disciplina necessária para alcançar seus objetivos.",
      color: "orange",
    },
    {
      icon: AcademicCapIcon,
      title: "Métodos de Revisão",
      description:
        "Active Recall, Técnica Feynman, resumos e questões práticas. Aumente sua retenção de conhecimento.",
      color: "indigo",
    },
    {
      icon: ChartBarIcon,
      title: "Analytics Avançados",
      description:
        "Descubra seus horários de pico, veja quanto tempo dedica a cada assunto e receba insights personalizados.",
      color: "rose",
    },
  ];

  const analyticsFeatures = [
    {
      icon: ArrowTrendingUpIcon,
      title: "Análise de Produtividade",
      description:
        "Descubra seus horários de pico e otimize sua rotina para maximizar resultados.",
    },
    {
      icon: LightBulbIcon,
      title: "Insights Inteligentes",
      description:
        "Receba recomendações personalizadas baseadas no seu comportamento real de estudo.",
    },
    {
      icon: TrophyIcon,
      title: "Métricas de Engajamento",
      description:
        "Acompanhe consistência, sequências e crescimento ao longo do tempo.",
    },
    {
      icon: SparklesIcon,
      title: "Relatórios Detalhados",
      description:
        "Visualize gráficos avançados e estatísticas completas sobre seu desempenho.",
    },
  ];

  // Hooks para animações de scroll reveal
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useScrollReveal({ threshold: 0.2 });
  const analyticsRef = useScrollReveal({ threshold: 0.2 });
  const howItWorksRef = useScrollReveal({ threshold: 0.2 });
  const ctaRef = useScrollReveal({ threshold: 0.2 });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 relative overflow-hidden transition-colors">
      {/* Elementos decorativos flutuantes no background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl particle-1"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl particle-2"></div>
        <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl particle-1"></div>
      </div>

      {/* Navigation - Minimalista com animação */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 navbar-animated transition-colors">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Plano Mestre</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogin}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={handleGetStarted}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm hover:shadow-md"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Moderno e Minimalista com Animações */}
      <section ref={heroRef as React.RefObject<HTMLElement>} className="pt-32 pb-24 px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium mb-8 border border-emerald-100 dark:border-emerald-800 animate-fade-in-down animate-float">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>100% Gratuito para começar</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight animate-fade-in-up">
            Estude de forma{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent gradient-animated text-glow-animated">
              inteligente
            </span>
            <br />
            e alcance seus objetivos
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            A plataforma completa para quem estuda a sério: concurseiros, programadores,
            estudantes universitários e profissionais. Organize, acompanhe e otimize seus
            estudos com ferramentas poderosas e gratuitas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold text-base hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 hover-lift hover-glow button-pulse group"
            >
              Começar Agora
              <ArrowRightIcon className="w-5 h-5 arrow-animated group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                analytics.trackButtonClick("watch_demo", "landing_page");
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-base border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover-lift"
            >
              Ver Funcionalidades
            </button>
          </div>

          {/* Social Proof - Minimalista com animação */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center gap-2 animate-float-slow">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              <span>100% Gratuito</span>
            </div>
            <div className="flex items-center gap-2 animate-float" style={{ animationDelay: "0.2s" }}>
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2 animate-float-fast" style={{ animationDelay: "0.4s" }}>
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              <span>Dados seguros</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Cards Modernos com Animações */}
      <section
        id="features"
        ref={featuresRef.elementRef as React.RefObject<HTMLElement>}
        className={`py-24 px-6 lg:px-8 bg-slate-50/50 relative z-10 ${featuresRef.isVisible ? "scroll-reveal revealed" : "scroll-reveal"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Tudo que você precisa para estudar com eficiência
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Seja você concurseiro, programador, estudante universitário ou profissional.
              Organize seus estudos, gerencie seus assuntos e acompanhe seu progresso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const staggerClass = `card-stagger-${Math.min(idx + 1, 6)}`;
              return (
                <div
                  key={idx}
                  className={`group relative p-6 rounded-xl border transition-all hover:shadow-lg hover-lift card-reveal ${staggerClass} bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 animate-float ${
                      feature.color === "emerald"
                        ? "bg-emerald-100 text-emerald-600"
                        : feature.color === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : feature.color === "purple"
                        ? "bg-purple-100 text-purple-600"
                        : feature.color === "orange"
                        ? "bg-orange-100 text-orange-600"
                        : feature.color === "indigo"
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-rose-100 text-rose-600"
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Analytics Section - Design Sofisticado com Animações */}
      <section
        ref={analyticsRef.elementRef as React.RefObject<HTMLElement>}
        className={`py-24 px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative z-10 ${analyticsRef.isVisible ? "scroll-reveal revealed" : "scroll-reveal"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium mb-6 border border-white/20 animate-float">
              <RocketLaunchIcon className="w-3.5 h-3.5" />
              <span>Analytics Avançados</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Analytics Avançados
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Transforme dados em resultados. Descubra padrões, otimize sua rotina e
              acelere seu aprendizado com insights baseados no seu comportamento real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {analyticsFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              const staggerClass = `card-stagger-${Math.min(idx + 1, 4)}`;
              return (
                <div
                  key={idx}
                  className={`bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 text-white hover-lift hover-glow card-reveal ${staggerClass} transition-all hover:bg-white/10`}
                >
                  <Icon className="w-7 h-7 mb-3 text-emerald-400 animate-float" style={{ animationDelay: `${idx * 0.2}s` }} />
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-2xl animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Por que Analytics são essenciais?
                </h3>
                <ul className="space-y-4 text-slate-700">
                  {[
                    {
                      title: "Identifique seus horários de pico:",
                      text: "Descubra quando você é mais produtivo e agende seus estudos mais importantes nesses momentos.",
                    },
                    {
                      title: "Mantenha a consistência:",
                      text: "Acompanhe sua sequência de dias estudados e mantenha a disciplina necessária.",
                    },
                    {
                      title: "Otimize seu tempo:",
                      text: "Veja quanto tempo dedica a cada assunto e distribua seu tempo de forma inteligente.",
                    },
                    {
                      title: "Insights personalizados:",
                      text: "Recomendações baseadas no seu comportamento para otimizar sua rotina.",
                    },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 animate-fade-in-left" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse-slow" />
                      <span className="text-sm leading-relaxed">
                        <strong className="text-slate-900">{item.title}</strong> {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl p-8 border border-slate-200 hover-lift animate-float-slow">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-semibold mb-4 animate-float">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    <span>Comece Grátis</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">
                    Comece a estudar de forma inteligente hoje
                  </h4>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Use todas as ferramentas gratuitas do Plano Mestre. Desbloqueie
                    Analytics quando estiver pronto para levar seu aprendizado ao próximo
                    nível.
                  </p>
                </div>
                <button
                  onClick={handleGetStarted}
                  className="w-full px-6 py-3.5 bg-slate-900 text-white rounded-lg font-semibold text-base hover:bg-slate-800 transition-all shadow-sm hover:shadow-md hover-lift hover-glow button-pulse"
                >
                  Começar Agora - Grátis
                </button>
                <p className="text-center text-xs text-slate-500 mt-4">
                  Sem cartão de crédito • Cancele quando quiser
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Minimalista com Animações */}
      <section
        ref={howItWorksRef.elementRef as React.RefObject<HTMLElement>}
        className={`py-24 px-6 lg:px-8 bg-white relative z-10 ${howItWorksRef.isVisible ? "scroll-reveal revealed" : "scroll-reveal"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Como Funciona
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Em 3 passos simples, você já está organizando seus estudos e maximizando
              seu aprendizado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                number: 1,
                color: "emerald",
                title: "Crie sua conta grátis",
                description: "Cadastre-se em menos de 1 minuto. Não precisa de cartão de crédito.",
              },
              {
                number: 2,
                color: "blue",
                title: "Organize seus estudos",
                description: "Adicione os assuntos que você está estudando e comece a usar as ferramentas imediatamente.",
              },
              {
                number: 3,
                color: "purple",
                title: "Estude e acompanhe",
                description: "Use o Pomodoro, flashcards, agendamentos e veja seu progresso crescer com métricas detalhadas.",
              },
            ].map((step, idx) => {
              const staggerClass = `card-stagger-${Math.min(idx + 1, 3)}`;
              return (
              <div key={idx} className={`text-center card-reveal ${staggerClass}`}>
                <div className={`w-14 h-14 ${step.color === "emerald" ? "bg-emerald-100 text-emerald-600" : step.color === "blue" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"} rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4 animate-float hover-lift transition-transform hover:scale-110`} style={{ animationDelay: `${idx * 0.2}s` }}>
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final - Minimalista com Animações */}
      <section
        ref={ctaRef.elementRef as React.RefObject<HTMLElement>}
        className={`py-24 px-6 lg:px-8 bg-slate-900 relative z-10 ${ctaRef.isVisible ? "scroll-reveal revealed" : "scroll-reveal"}`}
      >
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Pronto para estudar de forma inteligente?
          </h2>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            Junte-se a milhares de pessoas que estudam a sério - concurseiros,
            programadores, estudantes universitários e profissionais - que já estão usando
            o Plano Mestre para organizar seus estudos e alcançar seus objetivos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-900 rounded-lg font-semibold text-base hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover-lift hover-glow button-pulse group"
            >
              Criar Conta Grátis
              <ArrowRightIcon className="w-5 h-5 arrow-animated group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleLogin}
              className="w-full sm:w-auto px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium text-base border border-white/20 hover:bg-white/20 transition-all hover-lift"
            >
              Já tenho uma conta
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-8 flex flex-wrap items-center justify-center gap-4">
            <span className="animate-float-slow">✓ Sem compromisso</span>
            <span className="animate-float" style={{ animationDelay: "0.2s" }}>✓ Cancele quando quiser</span>
            <span className="animate-float-fast" style={{ animationDelay: "0.4s" }}>✓ Dados seguros</span>
          </p>
        </div>
      </section>

      {/* Footer - Minimalista */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base">✓</span>
              </div>
              <span className="text-white font-semibold text-sm">Plano Mestre</span>
            </div>
            <p className="text-xs text-slate-400 text-center max-w-md">
              A plataforma completa para quem estuda a sério.
            </p>
          </div>
          <div className="border-t border-slate-800 pt-4 text-center text-xs">
            <p>© {new Date().getFullYear()} Plano Mestre. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
