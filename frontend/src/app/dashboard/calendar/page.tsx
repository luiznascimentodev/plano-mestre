"use client";

import { useEffect, useState } from "react";
import { apiPrivate } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTimerStore } from "@/store/timer.store";

interface StudySession {
  id: number;
  duration: number;
  completedAt: string;
  topic: {
    id: number;
    name: string;
  };
}

interface ScheduledSession {
  id: number;
  scheduledAt: string;
  duration: number;
  notes?: string;
  isCompleted: boolean;
  topic: {
    id: number;
    name: string;
    status: string;
  };
}

interface Topic {
  id: number;
  name: string;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Normalizar para meio-dia
    return today;
  });
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<StudySession[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduledSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    topicId: "",
    scheduledAt: "",
    duration: "25",
    notes: "",
  });

  const startTimer = useTimerStore((state) => state.startTimer);
  const isTimerRunning = useTimerStore((state) => state.isRunning);

  // Calcular início e fim do dia
  const getDayRange = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Calcular início e fim da semana
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    // Ajustar para segunda-feira (0 = domingo, então -6; caso contrário -1)
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Calcular início e fim do mês
  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const range =
        viewMode === "day"
          ? getDayRange(currentDate)
          : viewMode === "week"
          ? getWeekRange(currentDate)
          : getMonthRange(currentDate);

      // Construir URL com parâmetros de forma segura
      const startDateStr = range.start.toISOString().split("T")[0];
      const endDateStr = range.end.toISOString().split("T")[0];

      const scheduledUrl = `/scheduled-sessions?startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}&includeCompleted=true`;

      const [topicsRes, scheduledRes, completedRes] = await Promise.all([
        apiPrivate.get("/topics"),
        apiPrivate.get(scheduledUrl).catch((err) => {
          // Se falhar com 404, tentar sem os parâmetros de período
          console.warn("Erro ao buscar por período, tentando sem filtros:", err);
          return apiPrivate.get("/scheduled-sessions?includeCompleted=true");
        }),
        apiPrivate.get("/study-sessions"),
      ]);

      setTopics(topicsRes.data);

      // Garantir que scheduledRes.data seja um array
      const scheduledData = Array.isArray(scheduledRes.data) ? scheduledRes.data : [];

      // Se não veio filtrado, filtrar no frontend
      const filteredScheduled = scheduledData.filter((s: ScheduledSession) => {
        const sessionDate = new Date(s.scheduledAt);
        return sessionDate >= range.start && sessionDate <= range.end;
      });

      setScheduledSessions(filteredScheduled);

      // Filtrar sessões completadas no período
      const completed = completedRes.data.filter((s: StudySession) => {
        const sessionDate = new Date(s.completedAt);
        return sessionDate >= range.start && sessionDate <= range.end;
      });
      setCompletedSessions(completed);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      // Em caso de erro, definir arrays vazios para não quebrar a UI
      setScheduledSessions([]);
      setCompletedSessions([]);
      if (err.response?.status === 404) {
        console.warn("Endpoint não encontrado. Verifique se o backend foi reiniciado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    analytics.trackPageView("/dashboard/calendar", "Calendário");
    analytics.trackFeatureAccessed("calendar_page");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.topicId || !scheduleForm.scheduledAt) return;

    try {
      const scheduledDateTime = new Date(scheduleForm.scheduledAt).toISOString();

      if (editingSession) {
        await apiPrivate.patch(`/scheduled-sessions/${editingSession.id}`, {
          topicId: parseInt(scheduleForm.topicId),
          scheduledAt: scheduledDateTime,
          duration: parseInt(scheduleForm.duration),
          notes: scheduleForm.notes || undefined,
        });
      } else {
        const response = await apiPrivate.post("/scheduled-sessions", {
          topicId: parseInt(scheduleForm.topicId),
          scheduledAt: scheduledDateTime,
          duration: parseInt(scheduleForm.duration),
          notes: scheduleForm.notes || undefined,
        });

        // Track session scheduling
        if (response.data?.id) {
          analytics.trackSessionScheduled(response.data.id, parseInt(scheduleForm.topicId));
        }
      }

      resetForm();
      fetchData();
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      alert("Erro ao salvar agendamento. Tente novamente.");
    }
  };

  const handleEdit = (session: ScheduledSession) => {
    setEditingSession(session);
    const date = new Date(session.scheduledAt);
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setScheduleForm({
      topicId: session.topic.id.toString(),
      scheduledAt: localDateTime,
      duration: session.duration.toString(),
      notes: session.notes || "",
    });
    setShowScheduleModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja remover este agendamento?")) return;
    try {
      await apiPrivate.delete(`/scheduled-sessions/${id}`);
      fetchData();
    } catch (err) {
      console.error("Erro ao remover agendamento:", err);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await apiPrivate.patch(`/scheduled-sessions/${id}/complete`);

      // Track session completion
      const session = scheduledSessions.find((s) => s.id === id);
      if (session) {
        analytics.trackSessionCompleted(id, session.topic.id);
      }

      fetchData();
    } catch (err) {
      console.error("Erro ao completar sessão:", err);
    }
  };

  const handleStartFromSchedule = (session: ScheduledSession) => {
    startTimer(session.topic.id, fetchData);
  };

  const resetForm = () => {
    setScheduleForm({
      topicId: "",
      scheduledAt: "",
      duration: "25",
      notes: "",
    });
    setEditingSession(null);
    setShowScheduleModal(false);
    setSelectedDate(null);
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Gerar dia único
  const getDay = () => {
    const day = new Date(currentDate);
    day.setHours(12, 0, 0, 0); // Normalizar para meio-dia para evitar problemas de timezone
    return day;
  };

  // Gerar dias da semana
  const getWeekDays = () => {
    const { start } = getWeekRange(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      day.setHours(12, 0, 0, 0); // Normalizar para meio-dia para evitar problemas de timezone
      days.push(day);
    }
    return days;
  };

  // Gerar dias do mês
  const getMonthDays = () => {
    const { start } = getMonthRange(currentDate);
    const firstDay = new Date(start);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Ajustar para começar na segunda-feira
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    firstDay.setDate(firstDay.getDate() - startDay);

    const days = [];
    const current = new Date(firstDay);
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    while (current <= endDate) {
      const day = new Date(current);
      day.setHours(12, 0, 0, 0); // Normalizar para meio-dia para evitar problemas de timezone
      days.push(day);
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  // Agrupar sessões por data
  const groupSessionsByDate = (sessions: ScheduledSession[]) => {
    const grouped: Record<string, ScheduledSession[]> = {};
    sessions.forEach((session) => {
      const date = new Date(session.scheduledAt).toISOString().split("T")[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });
    return grouped;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600";
      case "IN_PROGRESS":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
      case "REVIEWING":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
      case "COMPLETED":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
      default:
        return "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600";
    }
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const groupedScheduled = groupSessionsByDate(scheduledSessions);
  const groupedCompleted = completedSessions.reduce((acc, session) => {
    const date = new Date(session.completedAt).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, StudySession[]>);

  // Calcular range de horas baseado nos agendamentos
  const getHourRange = (dayStr: string) => {
    const dayScheduled = groupedScheduled[dayStr] || [];
    const dayCompleted = groupedCompleted[dayStr] || [];
    const allSessions = [...dayScheduled, ...dayCompleted];

    if (allSessions.length === 0) {
      // Range padrão: 6h às 22h
      return { start: 6, end: 22 };
    }

    // Encontrar a hora mais cedo e mais tarde
    let minHour = 24;
    let maxHour = 0;

    allSessions.forEach((session) => {
      const sessionDate = new Date(
        session.scheduledAt || (session as any).completedAt
      );
      const hour = sessionDate.getHours();
      const endHour = hour + Math.ceil((session.duration || 0) / 60);

      if (hour < minHour) minHour = hour;
      if (endHour > maxHour) maxHour = endHour;
    });

    // Adicionar margem de 2 horas antes e depois
    minHour = Math.max(0, minHour - 2);
    maxHour = Math.min(23, maxHour + 2);

    // Garantir um mínimo de 6h às 22h se não houver dados suficientes
    if (maxHour - minHour < 8) {
      minHour = Math.min(minHour, 6);
      maxHour = Math.max(maxHour, 22);
    }

    return { start: minHour, end: maxHour };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    const compareDate = new Date(date);

    // Normalizar para comparar apenas a data (sem hora)
    today.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);

    return compareDate.getTime() === today.getTime();
  };

  const isCurrentMonth = (date: Date) => {
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Calendário de Estudos</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Organize e visualize seus estudos agendados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-1">
            <button
              onClick={() => setViewMode("day")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "day"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700"
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700"
              }`}
            >
              Mês
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              resetForm();
              setShowScheduleModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Agendar
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (viewMode === "day") navigateDay("prev");
              else if (viewMode === "week") navigateWeek("prev");
              else navigateMonth("prev");
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-700 dark:text-slate-300"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 min-w-[200px] text-center">
            {viewMode === "day"
              ? currentDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : viewMode === "week"
              ? `${weekDays[0].toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                })} - ${weekDays[6].toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}`
              : currentDate.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
          </h2>
          <button
            onClick={() => {
              if (viewMode === "day") navigateDay("next");
              else if (viewMode === "week") navigateWeek("next");
              else navigateMonth("next");
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-700 dark:text-slate-300"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
            <span>Completado</span>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "day" ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {(() => {
            const dayStr = getDay().toISOString().split("T")[0];
            const dayScheduled = groupedScheduled[dayStr] || [];
            const dayCompleted = groupedCompleted[dayStr] || [];
            const hourRange = getHourRange(dayStr);
            const hours = Array.from(
              { length: hourRange.end - hourRange.start + 1 },
              (_, i) => hourRange.start + i
            );

            return (
              <>
                {/* Day Header */}
                <div className="grid grid-cols-2 border-b border-gray-200 dark:border-slate-700">
                  <div
                    className={`p-3 border-r border-gray-200 dark:border-slate-700 text-center ${
                      isToday(getDay()) ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-gray-50 dark:bg-slate-700/50"
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">
                      {getDay().toLocaleDateString("pt-BR", { weekday: "long" })}
                    </p>
                    <p
                      className={`text-lg font-bold mt-1 ${
                        isToday(getDay()) ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-slate-100"
                      }`}
                    >
                      {getDay().getDate()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-slate-700/50">
                    <p className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Hora</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2">
                  {/* Day Column */}
                  <div
                    className={`border-r border-gray-200 dark:border-slate-700 relative ${
                      isToday(getDay()) ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-white dark:bg-slate-800"
                    }`}
                  >
                    {hours.map((hour) => {
                      const hourScheduled = dayScheduled.filter((s) => {
                        const sessionHour = new Date(s.scheduledAt).getHours();
                        return sessionHour === hour;
                      });

                      const hourCompleted = dayCompleted.filter((s) => {
                        const sessionHour = new Date(s.completedAt).getHours();
                        return sessionHour === hour;
                      });

                      return (
                        <div
                          key={hour}
                          className="h-16 border-b border-gray-100 dark:border-slate-700 relative bg-white dark:bg-slate-800"
                          onDoubleClick={() => {
                            const date = new Date(getDay());
                            date.setHours(hour, 0, 0, 0);
                            setSelectedDate(date);
                            const localDateTime = new Date(
                              date.getTime() - date.getTimezoneOffset() * 60000
                            )
                              .toISOString()
                              .slice(0, 16);
                            setScheduleForm({
                              ...scheduleForm,
                              scheduledAt: localDateTime,
                            });
                            setShowScheduleModal(true);
                          }}
                        >
                          {hourScheduled.map((session) => (
                            <div
                              key={session.id}
                              className={`absolute left-1 right-1 rounded-lg p-2 text-xs border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                                session.isCompleted
                                  ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200"
                                  : "bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-700 text-blue-900 dark:text-blue-200"
                              }`}
                              style={{
                                top: `${(new Date(session.scheduledAt).getMinutes() / 60) * 100}%`,
                                height: `${(session.duration / 60) * 100}%`,
                              }}
                              onClick={() => handleEdit(session)}
                            >
                              <p className="font-medium truncate">{session.topic.name}</p>
                              <p className="text-xs opacity-75">
                                {formatDateTime(session.scheduledAt)} • {formatTime(session.duration)}
                              </p>
                              {session.notes && (
                                <p className="text-xs opacity-60 mt-1 truncate">{session.notes}</p>
                              )}
                            </div>
                          ))}
                          {hourCompleted.map((session) => (
                            <div
                              key={session.id}
                              className="absolute left-1 right-1 rounded-lg p-2 text-xs bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                              style={{
                                top: `${(new Date(session.completedAt).getMinutes() / 60) * 100}%`,
                                height: `${(session.duration / 60) * 100}%`,
                              }}
                            >
                              <p className="font-medium truncate">{session.topic.name}</p>
                              <p className="text-xs opacity-75">
                                {formatTime(session.duration)}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Time Column */}
                  <div className="border-l border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 border-b border-gray-100 dark:border-slate-700 flex items-start justify-start pl-2 pt-1 bg-white dark:bg-slate-800"
                      >
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : viewMode === "week" ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Week Header */}
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-slate-700">
            <div className="p-3 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Hora</p>
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0 ${
                  isToday(day) ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-gray-50 dark:bg-slate-700/50"
                }`}
              >
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">
                  {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                </p>
                <p
                  className={`text-lg font-bold mt-1 ${
                    isToday(day) ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-slate-100"
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-8">
            {/* Time Column */}
            <div className="border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="h-16 border-b border-gray-100 dark:border-slate-700 flex items-start justify-end pr-2 pt-1 bg-white dark:bg-slate-800"
                >
                  <span className="text-xs text-gray-500 dark:text-slate-400">{i.toString().padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {weekDays.map((day) => {
              const dayStr = day.toISOString().split("T")[0];
              const dayScheduled = groupedScheduled[dayStr] || [];
              const dayCompleted = groupedCompleted[dayStr] || [];

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-gray-200 dark:border-slate-700 last:border-r-0 relative ${
                    isToday(day) ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-white dark:bg-slate-800"
                  }`}
                >
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourScheduled = dayScheduled.filter((s) => {
                      const sessionHour = new Date(s.scheduledAt).getHours();
                      return sessionHour === hour;
                    });

                    const hourCompleted = dayCompleted.filter((s) => {
                      const sessionHour = new Date(s.completedAt).getHours();
                      return sessionHour === hour;
                    });

                    return (
                      <div
                        key={hour}
                        className="h-16 border-b border-gray-100 dark:border-slate-700 relative bg-white dark:bg-slate-800"
                        onDoubleClick={() => {
                          const date = new Date(day);
                          date.setHours(hour, 0, 0, 0);
                          setSelectedDate(date);
                          const localDateTime = new Date(
                            date.getTime() - date.getTimezoneOffset() * 60000
                          )
                            .toISOString()
                            .slice(0, 16);
                          setScheduleForm({
                            ...scheduleForm,
                            scheduledAt: localDateTime,
                          });
                          setShowScheduleModal(true);
                        }}
                      >
                        {hourScheduled.map((session) => (
                          <div
                            key={session.id}
                            className={`absolute left-1 right-1 rounded-lg p-2 text-xs border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                              session.isCompleted
                                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200"
                                : "bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-700 text-blue-900 dark:text-blue-200"
                            }`}
                            style={{
                              top: `${(new Date(session.scheduledAt).getMinutes() / 60) * 100}%`,
                              height: `${(session.duration / 60) * 100}%`,
                            }}
                            onClick={() => handleEdit(session)}
                          >
                            <p className="font-medium truncate">{session.topic.name}</p>
                            <p className="text-xs opacity-75">
                              {formatDateTime(session.scheduledAt)} • {formatTime(session.duration)}
                            </p>
                          </div>
                        ))}
                        {hourCompleted.map((session) => (
                          <div
                            key={session.id}
                            className="absolute left-1 right-1 rounded-lg p-2 text-xs bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                            style={{
                              top: `${(new Date(session.completedAt).getMinutes() / 60) * 100}%`,
                              height: `${(session.duration / 60) * 100}%`,
                            }}
                          >
                            <p className="font-medium truncate">{session.topic.name}</p>
                            <p className="text-xs opacity-75">
                              {formatTime(session.duration)}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Month Grid */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="p-3 text-center bg-gray-50 dark:bg-slate-700/50 border-r border-gray-200 dark:border-slate-700 last:border-r-0">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">{day}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => {
              const dayStr = day.toISOString().split("T")[0];
              const dayScheduled = groupedScheduled[dayStr] || [];
              const dayCompleted = groupedCompleted[dayStr] || [];
              const isCurrentMonthDay = isCurrentMonth(day);

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] border-r border-b border-gray-200 dark:border-slate-700 p-2 ${
                    !isCurrentMonthDay ? "bg-gray-50 dark:bg-slate-700/50" : ""
                  } ${isToday(day) ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isToday(day)
                          ? "bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          : isCurrentMonthDay
                          ? "text-gray-900 dark:text-slate-100"
                          : "text-gray-400 dark:text-slate-500"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {(dayScheduled.length > 0 || dayCompleted.length > 0) && (
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {dayScheduled.length + dayCompleted.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayScheduled.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className={`text-xs p-1.5 rounded border-l-2 cursor-pointer hover:shadow-sm transition-shadow ${
                          session.isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-300"
                        }`}
                        onClick={() => handleEdit(session)}
                      >
                        <p className="font-medium truncate">{session.topic.name}</p>
                        <p className="text-xs opacity-75">
                          {formatDateTime(session.scheduledAt)}
                        </p>
                      </div>
                    ))}
                    {dayCompleted.slice(0, 2).map((session) => (
                      <div
                        key={session.id}
                        className="text-xs p-1.5 rounded bg-emerald-50 dark:bg-emerald-900/20 border-l-2 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                      >
                        <p className="font-medium truncate">{session.topic.name}</p>
                        <p className="text-xs opacity-75">{formatTime(session.duration)}</p>
                      </div>
                    ))}
                    {(dayScheduled.length > 3 || dayCompleted.length > 2) && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        +{dayScheduled.length - 3 + dayCompleted.length - 2} mais
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduled Sessions List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Agendamentos</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {scheduledSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
              <p>Nenhum agendamento neste período</p>
            </div>
          ) : (
            scheduledSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 hover:bg-gray-50 dark:bg-slate-700/50 transition-colors ${
                  session.isCompleted ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                          session.topic.status
                        )}`}
                      >
                        {session.topic.status === "NOT_STARTED"
                          ? "Não Iniciado"
                          : session.topic.status === "IN_PROGRESS"
                          ? "Em Progresso"
                          : session.topic.status === "REVIEWING"
                          ? "Revisando"
                          : "Concluído"}
                      </div>
                      {session.isCompleted && (
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium">
                          Concluído
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                      {session.topic.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDateTime(session.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatTime(session.duration)}</span>
                      </div>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!session.isCompleted && (
                      <>
                        <button
                          onClick={() => handleStartFromSchedule(session)}
                          disabled={isTimerRunning}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 dark:bg-emerald-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Iniciar Pomodoro"
                        >
                          <ClockIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(session)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleComplete(session.id)}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                          title="Marcar como concluída"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      title="Remover"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {editingSession ? "Editar Agendamento" : "Novo Agendamento"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Assunto
                </label>
                <select
                  value={scheduleForm.topicId}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, topicId: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                >
                  <option value="">Selecione um assunto</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={scheduleForm.duration}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, duration: e.target.value })
                  }
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  placeholder="Ex: Revisar capítulo 3, fazer exercícios..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {editingSession ? "Salvar Alterações" : "Agendar"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700/50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
