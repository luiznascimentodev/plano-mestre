"use client";

import { useEffect, useState } from "react";
import { apiPrivate } from "@/lib/api";
import { useTimerStore } from "@/store/timer.store";
import { analytics } from "@/lib/analytics";
import {
  PlayIcon,
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PlayIcon as PlayIconSolid } from "@heroicons/react/24/solid";
import CreateTopicForm from "@/components/topics/CreateTopicForm";

interface Topic {
  id: number;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED";
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  description?: string;
  tags?: string;
  color?: string;
}

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
  topic: {
    id: number;
    name: string;
  };
}

export default function DashboardPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<
    ScheduledSession[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    topicId: "",
    scheduledAt: "",
    duration: "25",
    notes: "",
  });

  const startTimer = useTimerStore((state) => state.startTimer);
  const isTimerRunning = useTimerStore((state) => state.isRunning);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split("T")[0];

      const [topicsRes, sessionsRes, scheduledRes] = await Promise.all([
        apiPrivate.get("/topics"),
        apiPrivate.get("/study-sessions"),
        apiPrivate.get(`/scheduled-sessions?date=${today}`),
      ]);

      setTopics(topicsRes.data);
      setRecentSessions(sessionsRes.data.slice(0, 5));
      setScheduledSessions(scheduledRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    analytics.trackPageView("/dashboard", "Página Inicial");
    analytics.trackFeatureAccessed("dashboard");
  }, []);

  const handleTopicCreated = () => {
    setShowCreateTopic(false);
    fetchData();
  };

  const handleStartPomodoro = (topicId: number) => {
    startTimer(topicId, fetchData);
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.topicId || !scheduleForm.scheduledAt) return;

    try {
      // datetime-local retorna formato YYYY-MM-DDTHH:mm
      const scheduledDateTime = new Date(
        scheduleForm.scheduledAt
      ).toISOString();

      await apiPrivate.post("/scheduled-sessions", {
        topicId: parseInt(scheduleForm.topicId),
        scheduledAt: scheduledDateTime,
        duration: parseInt(scheduleForm.duration),
        notes: scheduleForm.notes || undefined,
      });

      setScheduleForm({
        topicId: "",
        scheduledAt: "",
        duration: "25",
        notes: "",
      });
      setShowScheduleModal(false);
      fetchData();
    } catch (err) {
      console.error("Erro ao agendar sessão:", err);
      alert("Erro ao agendar sessão. Tente novamente.");
    }
  };

  const handleCompleteScheduled = async (id: number) => {
    try {
      await apiPrivate.patch(`/scheduled-sessions/${id}/complete`);
      fetchData();
    } catch (err) {
      console.error("Erro ao completar sessão:", err);
    }
  };

  const handleDeleteScheduled = async (id: number) => {
    if (!confirm("Deseja remover este agendamento?")) return;
    try {
      await apiPrivate.delete(`/scheduled-sessions/${id}`);
      fetchData();
    } catch (err) {
      console.error("Erro ao remover agendamento:", err);
    }
  };

  const getStatusColor = (status: Topic["status"]) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-slate-100 text-slate-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "REVIEWING":
        return "bg-amber-100 text-amber-700";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";
    }
  };

  const getStatusLabel = (status: Topic["status"]) => {
    switch (status) {
      case "NOT_STARTED":
        return "Não Iniciado";
      case "IN_PROGRESS":
        return "Em Progresso";
      case "REVIEWING":
        return "Revisando";
      case "COMPLETED":
        return "Concluído";
    }
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
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const todaySessions = recentSessions.filter((session) => {
    const sessionDate = new Date(session.completedAt)
      .toISOString()
      .split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return sessionDate === today;
  });

  const todayMinutes = todaySessions.reduce(
    (acc, session) => acc + session.duration,
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm text-sm font-medium"
          >
            <CalendarIcon className="w-4 h-4" />
            Agendar
          </button>
          <button
            onClick={() => setShowCreateTopic(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm hover:shadow-md text-sm font-semibold"
          >
            <PlusIcon className="w-4 h-4" />
            Novo Assunto
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1.5">Estudado Hoje</p>
              <p className="text-3xl font-bold tracking-tight">
                {formatTime(todayMinutes)}
              </p>
              <p className="text-xs opacity-75 mt-1.5">
                {todaySessions.length} sessões
              </p>
            </div>
            <ClockIcon className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1.5">Total de Assuntos</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {topics.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {topics.filter((t) => t.status === "IN_PROGRESS").length} em
                progresso
              </p>
            </div>
            <BookOpenIcon className="w-12 h-12 text-emerald-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1.5">Agendado Hoje</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {scheduledSessions.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">sessões</p>
            </div>
            <CalendarIcon className="w-12 h-12 text-blue-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Meus Assuntos
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {topics.length} total
              </span>
            </div>
          </div>
          <div className="p-6">
            {topics.length === 0 ? (
              <div className="text-center py-8">
                <BookOpenIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                  Nenhum assunto cadastrado
                </p>
                <button
                  onClick={() => setShowCreateTopic(true)}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md text-sm font-semibold"
                >
                  Criar Primeiro Assunto
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(
                          topic.status
                        )}`}
                      >
                        {getStatusLabel(topic.status)}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm">
                        {topic.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartPomodoro(topic.id)}
                      disabled={isTimerRunning}
                      className="ml-3 p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Iniciar Pomodoro"
                    >
                      <PlayIconSolid className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Sessions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Agendado para Hoje
              </h2>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
              >
                + Agendar
              </button>
            </div>
          </div>
          <div className="p-6">
            {scheduledSessions.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                  Nenhuma sessão agendada
                </p>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md text-sm font-semibold"
                >
                  Agendar Sessão
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {scheduledSessions.map((scheduled) => (
                  <div
                    key={scheduled.id}
                    className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {scheduled.topic.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {formatDateTime(scheduled.scheduledAt)} •{" "}
                          {formatTime(scheduled.duration)}
                        </p>
                        {scheduled.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            {scheduled.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 ml-3">
                        <button
                          onClick={() => handleCompleteScheduled(scheduled.id)}
                          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title="Marcar como concluída"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteScheduled(scheduled.id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Sessões Recentes
          </h2>
        </div>
        <div className="p-6">
          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Nenhuma sessão registrada ainda
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        {session.topic.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(session.completedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {formatTime(session.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Topic Modal */}
      {showCreateTopic && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Novo Assunto</h2>
              <button
                onClick={() => setShowCreateTopic(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <CreateTopicForm
              onTopicCreated={handleTopicCreated}
              isExpanded={true}
            />
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Agendar Sessão
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Assunto
                </label>
                <select
                  value={scheduleForm.topicId}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      topicId: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      scheduledAt: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={scheduleForm.duration}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      duration: e.target.value,
                    })
                  }
                  required
                  min="1"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notas (opcional)
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                  placeholder="Ex: Revisar capítulo 3"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  Agendar
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium"
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
