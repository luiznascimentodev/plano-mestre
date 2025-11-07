"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiPrivate } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  TagIcon,
  FlagIcon,
  PaintBrushIcon,
  Bars3BottomLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
type TopicPriority = "LOW" | "MEDIUM" | "HIGH";

interface Topic {
  id: number;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED";
  notes?: string;
  category?: string;
  priority?: TopicPriority;
  dueDate?: string;
  description?: string;
  tags?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudySession {
  id: number;
  duration: number;
  completedAt: string;
}

interface Flashcard {
  id: number;
  front: string;
  back: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  nextReview: string;
  reviewCount: number;
}

interface ScheduledSession {
  id: number;
  scheduledAt: string;
  duration: number;
  notes?: string;
  isCompleted: boolean;
}

interface Habit {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  isActive: boolean;
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = parseInt(params.id as string);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateFlashcard, setShowCreateFlashcard] = useState(false);
  const [showScheduleSession, setShowScheduleSession] = useState(false);

  // Related data
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    totalFlashcards: 0,
    pendingReviews: 0,
    scheduledCount: 0,
    completedScheduled: 0,
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    priority: "" as TopicPriority | "",
    dueDate: "",
    tags: "",
    color: "",
    notes: "",
  });

  // Flashcard form
  const [flashcardForm, setFlashcardForm] = useState({
    front: "",
    back: "",
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
  });

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: "",
    duration: "60",
    notes: "",
  });

  const fetchTopic = async () => {
    try {
      setIsLoading(true);
      const response = await apiPrivate.get(`/topics/${topicId}`);
      setTopic(response.data);
      setEditForm({
        name: response.data.name,
        description: response.data.description || "",
        category: response.data.category || "",
        priority: response.data.priority || "",
        dueDate: response.data.dueDate
          ? new Date(response.data.dueDate).toISOString().split("T")[0]
          : "",
        tags: response.data.tags || "",
        color: response.data.color || "",
        notes: response.data.notes || "",
      });
    } catch (err) {
      console.error("Erro ao carregar assunto:", err);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      // Study Sessions
      const sessionsRes = await apiPrivate.get("/study-sessions");
      const topicSessions = sessionsRes.data.filter(
        (s: any) => s.topicId === topicId
      );
      setStudySessions(topicSessions);

      // Flashcards
      const flashcardsRes = await apiPrivate.get(`/flashcards?topicId=${topicId}`);
      setFlashcards(flashcardsRes.data);

      // Scheduled Sessions
      const scheduledRes = await apiPrivate.get("/scheduled-sessions");
      const topicScheduled = scheduledRes.data.filter(
        (s: any) => s.topicId === topicId
      );
      setScheduledSessions(topicScheduled);

      // Habits
      const habitsRes = await apiPrivate.get("/habits");
      const topicHabits = habitsRes.data.filter((h: any) => h.topicId === topicId);
      setHabits(topicHabits);

      // Calculate stats
      const totalMinutes = topicSessions.reduce(
        (acc: number, s: StudySession) => acc + s.duration,
        0
      );
      const pendingReviews = flashcardsRes.data.filter(
        (f: Flashcard) => new Date(f.nextReview) <= new Date()
      ).length;
      const completedScheduled = topicScheduled.filter(
        (s: ScheduledSession) => s.isCompleted
      ).length;

      setStats({
        totalSessions: topicSessions.length,
        totalMinutes,
        totalFlashcards: flashcardsRes.data.length,
        pendingReviews,
        scheduledCount: topicScheduled.length,
        completedScheduled,
      });
    } catch (err) {
      console.error("Erro ao carregar dados relacionados:", err);
    }
  };

  useEffect(() => {
    if (topicId) {
      fetchTopic();
      fetchRelatedData();
    }
  }, [topicId]);

  // Track topic view
  useEffect(() => {
    if (topic) {
      analytics.trackTopicViewed(topic.id, topic.name);
    }
  }, [topic]);

  const handleUpdateTopic = async () => {
    if (!topic) return;

    try {
      const payload: any = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        category: editForm.category.trim() || undefined,
        priority: editForm.priority || undefined,
        dueDate: editForm.dueDate || undefined,
        tags: editForm.tags.trim() || undefined,
        color: editForm.color.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      };

      await apiPrivate.patch(`/topics/${topicId}`, payload);

      // Track topic update
      if (topic) {
        analytics.trackTopicUpdated(topic.id, editForm.name.trim() || topic.name);
      }

      await fetchTopic();
      setIsEditing(false);
    } catch (err) {
      console.error("Erro ao atualizar assunto:", err);
      alert("Erro ao atualizar assunto. Tente novamente.");
    }
  };

  const handleDeleteTopic = async () => {
    if (!topic) return;

    try {
      const topicName = topic.name;
      await apiPrivate.delete(`/topics/${topicId}`);

      // Track topic deletion
      analytics.trackTopicDeleted(topicId, topicName);

      router.push("/dashboard");
    } catch (err) {
      console.error("Erro ao excluir assunto:", err);
      alert("Erro ao excluir assunto. Tente novamente.");
    }
  };

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashcardForm.front.trim() || !flashcardForm.back.trim()) return;

    try {
      const response = await apiPrivate.post("/flashcards", {
        front: flashcardForm.front.trim(),
        back: flashcardForm.back.trim(),
        topicId: topicId,
        difficulty: flashcardForm.difficulty,
      });

      // Track flashcard creation
      if (response.data?.id) {
        analytics.trackFlashcardCreated(response.data.id, topicId);
      }

      setFlashcardForm({ front: "", back: "", difficulty: "MEDIUM" });
      setShowCreateFlashcard(false);
      fetchRelatedData();
    } catch (err) {
      console.error("Erro ao criar flashcard:", err);
      alert("Erro ao criar flashcard. Tente novamente.");
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.scheduledAt) return;

    try {
      const scheduledDateTime = new Date(scheduleForm.scheduledAt).toISOString();
      const response = await apiPrivate.post("/scheduled-sessions", {
        topicId: topicId,
        scheduledAt: scheduledDateTime,
        duration: parseInt(scheduleForm.duration),
        notes: scheduleForm.notes.trim() || undefined,
      });

      // Track session scheduling
      if (response.data?.id) {
        analytics.trackSessionScheduled(response.data.id, topicId);
      }

      setScheduleForm({ scheduledAt: "", duration: "60", notes: "" });
      setShowScheduleSession(false);
      fetchRelatedData();
    } catch (err) {
      console.error("Erro ao agendar sessão:", err);
      alert("Erro ao agendar sessão. Tente novamente.");
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

  const getStatusColor = (status: Topic["status"]) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-500 dark:border-yellow-700";
      case "IN_PROGRESS":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-500 dark:border-blue-700";
      case "REVIEWING":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-500 dark:border-orange-700";
      case "COMPLETED":
        return "bg-emerald-100 dark:bg-emerald-900/30 dark:bg-green-900/30 text-emerald-800 dark:text-emerald-300 dark:text-green-300 border-emerald-500 dark:border-emerald-700 dark:border-emerald-700 dark:border-emerald-600";
      default:
        return "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 border-gray-500 dark:border-slate-500";
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
      default:
        return status;
    }
  };

  const getPriorityColor = (priority?: TopicPriority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "MEDIUM":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "LOW":
        return "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200";
      default:
        return "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200";
    }
  };

  const getPriorityLabel = (priority?: TopicPriority) => {
    switch (priority) {
      case "HIGH":
        return "Alta";
      case "MEDIUM":
        return "Média";
      case "LOW":
        return "Baixa";
      default:
        return "Não definida";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Carregando assunto...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
            Assunto não encontrado
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{topic.name}</h1>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Criado em {new Date(topic.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
            {isEditing ? "Cancelar" : "Editar"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
            Excluir
          </button>
        </div>
      </div>

      {/* Start Study Session Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800/20 rounded-full flex items-center justify-center">
              <PlayIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Iniciar Sessão de Estudos</h2>
              <p className="text-emerald-100">
                Comece a estudar "{topic.name}" agora mesmo com o timer Pomodoro
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/dashboard/stats?topic=${topicId}`)}
            className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlayIcon className="w-6 h-6" />
            Iniciar Agora
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Sessões</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.totalSessions}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Tempo Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {formatTime(stats.totalMinutes)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpenIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Flashcards</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.totalFlashcards}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowPathIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.pendingReviews}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Agendadas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.scheduledCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Concluídas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {stats.completedScheduled}
          </p>
        </div>
      </div>

      {/* Topic Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Informações do Assunto
              </h2>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Bars3BottomLeftIcon className="w-4 h-4 inline mr-1" />
                    Descrição
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <TagIcon className="w-4 h-4 inline mr-1" />
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FlagIcon className="w-4 h-4 inline mr-1" />
                      Prioridade
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          priority: e.target.value as TopicPriority | "",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Não definida</option>
                      <option value="HIGH">Alta</option>
                      <option value="MEDIUM">Média</option>
                      <option value="LOW">Baixa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      Data Limite
                    </label>
                    <input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <PaintBrushIcon className="w-4 h-4 inline mr-1" />
                      Cor
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editForm.color || "#3B82F6"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, color: e.target.value })
                        }
                        className="h-10 w-20 border border-gray-300 dark:border-slate-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editForm.color}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            setEditForm({ ...editForm, color: value });
                          }
                        }}
                        placeholder="#3B82F6"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <TagIcon className="w-4 h-4 inline mr-1" />
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tags: e.target.value })
                    }
                    placeholder="Ex: direito, constitucional, prova"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleUpdateTopic}
                    className="flex-1 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 font-medium"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchTopic();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      topic.status
                    )}`}
                  >
                    {getStatusLabel(topic.status)}
                  </span>
                  {topic.priority && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                        topic.priority
                      )}`}
                    >
                      Prioridade: {getPriorityLabel(topic.priority)}
                    </span>
                  )}
                  {topic.category && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                      {topic.category}
                    </span>
                  )}
                  {topic.color && (
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-slate-600"
                      style={{ backgroundColor: topic.color }}
                    />
                  )}
                </div>

                {topic.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </h3>
                    <p className="text-gray-900 dark:text-slate-100">{topic.description}</p>
                  </div>
                )}

                {topic.dueDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      Data Limite
                    </h3>
                    <p className="text-gray-900 dark:text-slate-100">
                      {new Date(topic.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}

                {topic.tags && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {topic.tags.split(",").map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 rounded text-sm"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                Anotações
              </h2>
            </div>
            {isEditing ? (
              <textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Digite suas anotações sobre este assunto..."
              />
            ) : (
              <div className="prose max-w-none">
                {topic.notes ? (
                  <p className="text-gray-900 dark:text-slate-100 whitespace-pre-line">{topic.notes}</p>
                ) : (
                  <p className="text-gray-400 italic">
                    Nenhuma anotação ainda. Clique em "Editar" para adicionar.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/stats?topic=${topicId}`)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
              >
                <PlayIcon className="w-5 h-5" />
                Iniciar Sessão de Estudo
              </button>
              <button
                onClick={() => setShowCreateFlashcard(true)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Criar Flashcard
              </button>
              <button
                onClick={() => setShowScheduleSession(true)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <CalendarIcon className="w-5 h-5" />
                Agendar Sessão
              </button>
              <button
                onClick={() => router.push(`/dashboard/reviews?topic=${topicId}`)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
              >
                <BookOpenIcon className="w-5 h-5" />
                Revisar Flashcards
              </button>
            </div>
          </div>

          {/* Related Habits */}
          {habits.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                Hábitos Relacionados
              </h3>
              <div className="space-y-2">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    {habit.icon && <span className="text-xl">{habit.icon}</span>}
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-slate-100">
                      {habit.name}
                    </span>
                    {habit.isActive ? (
                      <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 rounded">
                        Inativo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Study Sessions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Sessões de Estudo ({studySessions.length})
          </h2>
        </div>
        {studySessions.length > 0 ? (
          <div className="space-y-2">
            {studySessions
              .sort(
                (a, b) =>
                  new Date(b.completedAt).getTime() -
                  new Date(a.completedAt).getTime()
              )
              .slice(0, 10)
              .map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {formatTime(session.duration)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {new Date(session.completedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhuma sessão de estudo registrada ainda.
          </p>
        )}
      </div>

      {/* Flashcards */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5" />
            Flashcards ({flashcards.length})
          </h2>
          <button
            onClick={() => setShowCreateFlashcard(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Novo
          </button>
        </div>
        {flashcards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashcards.slice(0, 6).map((flashcard) => (
              <div
                key={flashcard.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      flashcard.difficulty === "EASY"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : flashcard.difficulty === "MEDIUM"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {flashcard.difficulty === "EASY"
                      ? "Fácil"
                      : flashcard.difficulty === "MEDIUM"
                      ? "Médio"
                      : "Difícil"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {flashcard.reviewCount} revisões
                  </span>
                </div>
                <p className="font-medium text-gray-900 dark:text-slate-100 mb-1">{flashcard.front}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">{flashcard.back}</p>
                {new Date(flashcard.nextReview) <= new Date() && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">⚠️ Precisa revisar</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhum flashcard criado ainda.
          </p>
        )}
      </div>

      {/* Scheduled Sessions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Sessões Agendadas ({scheduledSessions.length})
          </h2>
          <button
            onClick={() => setShowScheduleSession(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Agendar
          </button>
        </div>
        {scheduledSessions.length > 0 ? (
          <div className="space-y-2">
            {scheduledSessions
              .sort(
                (a, b) =>
                  new Date(a.scheduledAt).getTime() -
                  new Date(b.scheduledAt).getTime()
              )
              .map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    session.isCompleted
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200 dark:border-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {new Date(session.scheduledAt).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Duração: {formatTime(session.duration)}
                    </p>
                    {session.notes && (
                      <p className="text-sm text-gray-500 mt-1">{session.notes}</p>
                    )}
                  </div>
                  {session.isCompleted ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhuma sessão agendada ainda.
          </p>
        )}
      </div>

      {/* Create Flashcard Modal */}
      {showCreateFlashcard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Novo Flashcard</h2>
              <button
                onClick={() => setShowCreateFlashcard(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-400"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateFlashcard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frente (Pergunta)
                </label>
                <textarea
                  value={flashcardForm.front}
                  onChange={(e) =>
                    setFlashcardForm({ ...flashcardForm, front: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verso (Resposta)
                </label>
                <textarea
                  value={flashcardForm.back}
                  onChange={(e) =>
                    setFlashcardForm({ ...flashcardForm, back: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dificuldade
                </label>
                <select
                  value={flashcardForm.difficulty}
                  onChange={(e) =>
                    setFlashcardForm({
                      ...flashcardForm,
                      difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="EASY">Fácil</option>
                  <option value="MEDIUM">Médio</option>
                  <option value="HARD">Difícil</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateFlashcard(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {showScheduleSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Agendar Sessão</h2>
              <button
                onClick={() => setShowScheduleSession(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-400"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleScheduleSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={scheduleForm.duration}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, duration: e.target.value })
                  }
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Agendar
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleSession(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Confirmar Exclusão
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Tem certeza que deseja excluir o assunto "{topic.name}"? Esta ação não
              pode ser desfeita e todos os dados relacionados serão removidos.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteTopic}
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600"
              >
                Excluir
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

