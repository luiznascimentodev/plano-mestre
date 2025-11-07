// /frontend/src/components/timer/GlobalPomodoroTimer.tsx
"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/timer.store";

// Helper para formatar segundos -> MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function GlobalPomodoroTimer() {
  const [isMounted, setIsMounted] = useState(false);

  // 1. "Ouvindo" o estado global do timer
  const timeLeft = useTimerStore((state) => state.timeLeft);
  const isRunning = useTimerStore((state) => state.isRunning);
  const tick = useTimerStore((state) => state.tick);
  const pauseTimer = useTimerStore((state) => state.pauseTimer);
  const resetTimer = useTimerStore((state) => state.resetTimer);

  // Evita erro de hidratação - só renderiza após montagem no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. O "Relógio" (Prática Consolidada de Timer no React)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning) {
      // Se o timer estiver rodando, crie um 'setInterval'
      // que chama a ação 'tick' do store a cada 1 segundo
      intervalId = setInterval(() => {
        tick();
      }, 1000);
    }

    // 3. A "Limpeza"
    // Esta função (return) é chamada quando o componente
    // é "desmontado" ou quando 'isRunning' muda.
    return () => {
      if (intervalId) {
        clearInterval(intervalId); // Limpa o intervalo
      }
    };
  }, [isRunning, tick]); // Dependências do efeito

  // Não renderiza até que o componente esteja montado no cliente
  if (!isMounted) {
    return null;
  }

  // Se o timer não estiver rodando e estiver cheio, não mostre nada
  // (Ou podemos mostrar um ícone pequeno, mas por simplicidade,
  // vamos esconder se não foi iniciado por um Tópico)
  const isPristine = timeLeft === 25 * 60 && !isRunning;
  if (isPristine) {
    return null; // Não mostra nada até ser iniciado
  }

  // 4. A UI (O Timer Visível)
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 transition-colors">
      <div className="flex items-center gap-4">
        {/* O Tempo */}
        <div className="text-3xl font-semibold text-gray-900 dark:text-slate-100">
          {formatTime(timeLeft)}
        </div>

        {/* Botões de Ação */}
        <div>
          {isRunning ? (
            <button
              onClick={pauseTimer}
              className="px-3 py-1 text-sm text-white bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700 rounded transition-colors"
            >
              Pausar
            </button>
          ) : (
            // (TODO: Adicionar botão 'Continuar' se timeLeft < duration)
            <span className="text-sm text-gray-500 dark:text-slate-400">Pausado</span>
          )}
          <button
            onClick={resetTimer}
            className="ml-2 px-3 py-1 text-sm text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded transition-colors"
          >
            Resetar
          </button>
        </div>
      </div>
    </div>
  );
}
