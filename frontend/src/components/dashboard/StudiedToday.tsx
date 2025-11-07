"use client";

import { ClockIcon } from "@heroicons/react/24/outline";

interface StudySession {
  id: number;
  duration: number;
  completedAt: string;
  topic: {
    id: number;
    name: string;
    status: string;
  };
}

interface StudiedTodayProps {
  sessions: StudySession[];
}

export default function StudiedToday({ sessions }: StudiedTodayProps) {
  // Filtrar sessões de hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = sessions.filter((session) => {
    const sessionDate = new Date(session.completedAt);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  // Calcular tempo total
  const totalMinutes = todaySessions.reduce(
    (acc, session) => acc + session.duration,
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalTimeFormatted = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:00`;

  // Formatar hora da sessão
  const formatSessionTime = (dateString: string, duration: number) => {
    const startDate = new Date(dateString);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const startTime = startDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = endDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { startTime, endTime };
  };

  // Formatar duração
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:00`;
  };

  // Obter ícone baseado no status do tópico
  const getTopicIcon = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "📘";
      case "REVIEWING":
        return "🔄";
      case "COMPLETED":
        return "✅";
      default:
        return "📚";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <ClockIcon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Estudado hoje</h2>
      </div>

      {todaySessions.length > 0 ? (
        <>
          <div className="space-y-3 mb-4">
            {todaySessions.map((session) => {
              const { startTime, endTime } = formatSessionTime(
                session.completedAt,
                session.duration
              );
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ClockIcon className="w-5 h-5 text-green-600 dark:text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        de {startTime} às {endTime}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">
                          {getTopicIcon(session.topic.status)}
                        </span>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {session.topic.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {formatDuration(session.duration)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Tempo líquido total
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {totalTimeFormatted}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
          <p className="text-sm">Nenhuma sessão de estudo hoje.</p>
          <p className="text-xs mt-1">Comece um Pomodoro para registrar seu progresso!</p>
        </div>
      )}
    </div>
  );
}

