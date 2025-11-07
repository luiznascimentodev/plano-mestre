"use client";

import { CalendarIcon } from "@heroicons/react/24/outline";

export default function ScheduledToday() {
  // Por enquanto, retornamos um componente vazio
  // Futuramente, quando implementarmos agendamento, preencheremos aqui
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Agendado para hoje
        </h2>
      </div>

      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
        <p className="text-sm">Nenhum estudo agendado para hoje.</p>
        <p className="text-xs mt-1">
          Esta funcionalidade será implementada em breve.
        </p>
      </div>
    </div>
  );
}

