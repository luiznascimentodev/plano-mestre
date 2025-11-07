"use client";

import { useEffect, useState } from "react";
import { apiPrivate } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import {
  PlusIcon,
  XMarkIcon,
  FireIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  PaintBrushIcon,
  TagIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";

interface Habit {
  id: number;
  name: string;
  description?: string;
  type: "STUDY_TIME" | "SESSIONS_COUNT" | "TOPICS_COMPLETED" | "REVIEWS_DONE" | "CUSTOM";
  frequency: "DAILY" | "WEEKLY" | "CUSTOM";
  targetValue?: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  customDays?: string;
  topicId?: number;
  topic?: {
    id: number;
    name: string;
  };
  completions?: HabitCompletion[];
}

interface HabitCompletion {
  id: number;
  completedAt: string;
  value?: number;
  notes?: string;
}

interface HabitStats {
  totalCompletions: number;
  currentStreak: number;
  bestStreak: number;
  monthCompletions: number;
  completionRate: number;
  averageValue: number;
}

interface Topic {
  id: number;
  name: string;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CUSTOM" as Habit["type"],
    frequency: "DAILY" as Habit["frequency"],
    targetValue: "",
    color: "",
    icon: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    customDays: "",
    topicId: "",
  });

  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const response = await apiPrivate.get("/habits?includeInactive=false");
      setHabits(response.data);
    } catch (err) {
      console.error("Erro ao carregar hábitos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await apiPrivate.get("/topics");
      setTopics(response.data);
    } catch (err) {
      console.error("Erro ao carregar assuntos:", err);
    }
  };

  const fetchHabitStats = async (habitId: number) => {
    try {
      const response = await apiPrivate.get(`/habits/${habitId}/stats`);
      setHabitStats(response.data);
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  };

  useEffect(() => {
    fetchHabits();
    fetchTopics();
    analytics.trackPageView("/dashboard/habits", "Hábitos");
    analytics.trackFeatureAccessed("habits_page");
  }, []);

  useEffect(() => {
    if (selectedHabit) {
      fetchHabitStats(selectedHabit.id);
    }
  }, [selectedHabit]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        frequency: formData.frequency,
        color: formData.color.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        customDays: formData.customDays.trim() || undefined,
      };

      if (formData.targetValue) {
        payload.targetValue = parseInt(formData.targetValue);
      }

      if (formData.topicId) {
        payload.topicId = parseInt(formData.topicId);
      }

      let response;
      if (editingHabit) {
        response = await apiPrivate.patch(`/habits/${editingHabit.id}`, payload);
        // Track habit update
        if (response.data) {
          analytics.trackHabitUpdated(editingHabit.id, formData.name.trim());
        }
      } else {
        response = await apiPrivate.post("/habits", payload);
        // Track habit creation
        if (response.data?.id) {
          analytics.trackHabitCreated(response.data.id, formData.name.trim());
        }
      }

      resetForm();
      fetchHabits();
    } catch (err) {
      console.error("Erro ao salvar hábito:", err);
      alert("Erro ao salvar hábito. Tente novamente.");
    }
  };

  const handleCompleteHabit = async (habitId: number, date?: string) => {
    try {
      await apiPrivate.post(`/habits/${habitId}/complete`, {
        completedAt: date || new Date().toISOString(),
      });

      // Track habit completion
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        analytics.trackHabitCompleted(habitId, habit.name);
      }

      fetchHabits();
      if (selectedHabit && selectedHabit.id === habitId) {
        fetchHabitStats(habitId);
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        alert("Este hábito já foi completado nesta data.");
      } else {
        console.error("Erro ao completar hábito:", err);
        alert("Erro ao completar hábito. Tente novamente.");
      }
    }
  };

  const handleUncompleteHabit = async (habitId: number, completionId: number) => {
    try {
      await apiPrivate.delete(`/habits/${habitId}/completions/${completionId}`);
      fetchHabits();
      if (selectedHabit && selectedHabit.id === habitId) {
        fetchHabitStats(habitId);
      }
    } catch (err) {
      console.error("Erro ao remover conclusão:", err);
    }
  };

  const handleDeleteHabit = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este hábito?")) return;

    try {
      await apiPrivate.delete(`/habits/${id}`);

      // Track habit deletion
      analytics.trackHabitDeleted(id);

      fetchHabits();
      if (selectedHabit?.id === id) {
        setSelectedHabit(null);
        setHabitStats(null);
      }
    } catch (err) {
      console.error("Erro ao excluir hábito:", err);
    }
  };

  const handleToggleActive = async (habit: Habit) => {
    try {
      await apiPrivate.patch(`/habits/${habit.id}`, {
        isActive: !habit.isActive,
      });
      fetchHabits();
    } catch (err) {
      console.error("Erro ao atualizar hábito:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "CUSTOM",
      frequency: "DAILY",
      targetValue: "",
      color: "",
      icon: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      customDays: "",
      topicId: "",
    });
    setEditingHabit(null);
    setShowCreateForm(false);
  };

  const startEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description || "",
      type: habit.type,
      frequency: habit.frequency,
      targetValue: habit.targetValue?.toString() || "",
      color: habit.color || "",
      icon: habit.icon || "",
      startDate: new Date(habit.startDate).toISOString().split("T")[0],
      endDate: habit.endDate ? new Date(habit.endDate).toISOString().split("T")[0] : "",
      customDays: habit.customDays || "",
      topicId: habit.topicId?.toString() || "",
    });
    setShowCreateForm(true);
  };

  const isHabitCompletedToday = (habit: Habit) => {
    if (!habit.completions) return false;
    const today = new Date().toISOString().split("T")[0];
    return habit.completions.some(
      (c) => new Date(c.completedAt).toISOString().split("T")[0] === today
    );
  };

  const isHabitCompletedOnDate = (habit: Habit, date: string) => {
    if (!habit.completions) return false;
    return habit.completions.some(
      (c) => new Date(c.completedAt).toISOString().split("T")[0] === date
    );
  };

  const getCompletionForDate = (habit: Habit, date: string) => {
    if (!habit.completions) return null;
    return habit.completions.find(
      (c) => new Date(c.completedAt).toISOString().split("T")[0] === date
    ) || null;
  };

  const presetColors = [
    { name: "Azul", value: "#3B82F6" },
    { name: "Verde", value: "#10B981" },
    { name: "Amarelo", value: "#F59E0B" },
    { name: "Vermelho", value: "#EF4444" },
    { name: "Roxo", value: "#8B5CF6" },
    { name: "Rosa", value: "#EC4899" },
    { name: "Ciano", value: "#06B6D4" },
    { name: "Laranja", value: "#F97316" },
  ];

  const presetIcons = ["📚", "⏰", "🎯", "🔥", "💪", "📖", "✍️", "🧠", "📝", "🎓"];

  const getHabitTypeLabel = (type: Habit["type"]) => {
    switch (type) {
      case "STUDY_TIME":
        return "Tempo de Estudo";
      case "SESSIONS_COUNT":
        return "Número de Sessões";
      case "TOPICS_COMPLETED":
        return "Assuntos Completados";
      case "REVIEWS_DONE":
        return "Revisões Feitas";
      default:
        return "Personalizado";
    }
  };

  const getFrequencyLabel = (frequency: Habit["frequency"]) => {
    switch (frequency) {
      case "DAILY":
        return "Diário";
      case "WEEKLY":
        return "Semanal";
      case "CUSTOM":
        return "Personalizado";
      default:
        return frequency;
    }
  };

  // Gerar dias do mês atual
  const getMonthDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const monthDays = getMonthDays();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Carregando hábitos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Hábitos</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Construa e acompanhe seus hábitos de estudo
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Hábito
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingHabit ? "Editar Hábito" : "Criar Novo Hábito"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Nome do Hábito <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Estudar 25 minutos por dia"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Descreva seu hábito..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Tipo e Frequência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    <TagIcon className="w-4 h-4 inline mr-1" />
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as Habit["type"] })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CUSTOM">Personalizado</option>
                    <option value="STUDY_TIME">Tempo de Estudo</option>
                    <option value="SESSIONS_COUNT">Número de Sessões</option>
                    <option value="TOPICS_COMPLETED">Assuntos Completados</option>
                    <option value="REVIEWS_DONE">Revisões Feitas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    <FlagIcon className="w-4 h-4 inline mr-1" />
                    Frequência
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frequency: e.target.value as Habit["frequency"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="DAILY">Diário</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="CUSTOM">Personalizado</option>
                  </select>
                </div>
              </div>

              {/* Valor Alvo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Valor Alvo (opcional)
                </label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) =>
                    setFormData({ ...formData, targetValue: e.target.value })
                  }
                  placeholder="Ex: 25 (minutos), 3 (sessões)"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {formData.type === "STUDY_TIME" && "Minutos de estudo"}
                  {formData.type === "SESSIONS_COUNT" && "Número de sessões"}
                  {formData.type === "TOPICS_COMPLETED" && "Assuntos completados"}
                  {formData.type === "REVIEWS_DONE" && "Revisões feitas"}
                  {formData.type === "CUSTOM" && "Valor personalizado"}
                </p>
              </div>

              {/* Assunto Relacionado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  <BookOpenIcon className="w-4 h-4 inline mr-1" />
                  Assunto Relacionado (opcional)
                </label>
                <select
                  value={formData.topicId}
                  onChange={(e) =>
                    setFormData({ ...formData, topicId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Nenhum</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Data Limite (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Dias Customizados */}
              {formData.frequency === "CUSTOM" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Dias da Semana (ex: 1,3,5 para Seg, Qua, Sex)
                  </label>
                  <input
                    type="text"
                    value={formData.customDays}
                    onChange={(e) =>
                      setFormData({ ...formData, customDays: e.target.value })
                    }
                    placeholder="1,3,5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
                  </p>
                </div>
              )}

              {/* Ícone e Cor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Ícone/Emoji
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {presetIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`w-10 h-10 text-2xl rounded-lg border-2 transition-all ${
                            formData.icon === icon
                              ? "border-emerald-500 dark:border-emerald-600 dark:border-emerald-500 scale-110"
                              : "border-gray-300 dark:border-slate-600 hover:border-gray-400"
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      placeholder="Ou digite um emoji"
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <PaintBrushIcon className="w-4 h-4 inline mr-1" />
                    Cor
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {presetColors.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: preset.value })}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            formData.color === preset.value
                              ? "border-gray-900 scale-110"
                              : "border-gray-300 dark:border-slate-600 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color || "#3B82F6"}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="h-10 w-20 border border-gray-300 dark:border-slate-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            setFormData({ ...formData, color: value });
                          }
                        }}
                        placeholder="#3B82F6"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  {editingHabit ? "Atualizar" : "Criar"} Hábito
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hábitos Grid */}
      {habits.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
          <FireIcon className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
            Nenhum hábito criado ainda
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
            Crie seu primeiro hábito para começar a acompanhar sua consistência
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Criar Primeiro Hábito
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => {
            const completedToday = isHabitCompletedToday(habit);
            const completion = habit.completions?.[0];

            return (
              <div
                key={habit.id}
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${
                  completedToday
                    ? "border-emerald-500 dark:border-emerald-600 dark:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20"
                    : "border-gray-200 dark:border-slate-700"
                }`}
                style={{
                  borderLeftColor: habit.color || "#3B82F6",
                  borderLeftWidth: "6px",
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {habit.icon && (
                      <span className="text-3xl">{habit.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg truncate">
                        {habit.name}
                      </h3>
                      {habit.description && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mt-1">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(habit)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 dark:bg-slate-700"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 dark:bg-slate-700"
                      title="Excluir"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full">
                    {getHabitTypeLabel(habit.type)}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full">
                    {getFrequencyLabel(habit.frequency)}
                  </span>
                  {habit.topic && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {habit.topic.name}
                    </span>
                  )}
                  {habit.targetValue && (
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                      Meta: {habit.targetValue}
                    </span>
                  )}
                </div>

                {/* Stats */}
                {habit.completions && habit.completions.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400">Total completado:</span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {habit.completions.length}x
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => {
                    if (completedToday && completion) {
                      handleUncompleteHabit(habit.id, completion.id);
                    } else {
                      handleCompleteHabit(habit.id);
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    completedToday
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/40"
                      : "bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600"
                  }`}
                >
                  {completedToday ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircleIconSolid className="w-5 h-5" />
                      Completado Hoje
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      Marcar como Feito
                    </div>
                  )}
                </button>

                {/* View Details */}
                <button
                  onClick={() => setSelectedHabit(habit)}
                  className="w-full mt-2 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Ver Detalhes →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Habit Details Modal */}
      {selectedHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {selectedHabit.icon && (
                  <span className="text-4xl">{selectedHabit.icon}</span>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {selectedHabit.name}
                  </h2>
                  {selectedHabit.description && (
                    <p className="text-gray-600 dark:text-slate-400 mt-1">{selectedHabit.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedHabit(null);
                  setHabitStats(null);
                }}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Stats Cards */}
            {habitStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Sequência Atual</div>
                  <div className="text-3xl font-bold">{habitStats.currentStreak}</div>
                  <div className="text-xs opacity-80">dias</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Melhor Sequência</div>
                  <div className="text-3xl font-bold">{habitStats.bestStreak}</div>
                  <div className="text-xs opacity-80">dias</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Este Mês</div>
                  <div className="text-3xl font-bold">{habitStats.monthCompletions}</div>
                  <div className="text-xs opacity-80">completos</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Taxa</div>
                  <div className="text-3xl font-bold">{habitStats.completionRate}%</div>
                  <div className="text-xs opacity-80">do mês</div>
                </div>
              </div>
            )}

            {/* Calendar View */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                Calendário de Completude
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-600 dark:text-slate-400 py-2"
                  >
                    {day}
                  </div>
                ))}
                {monthDays.map((day, idx) => {
                  const dateStr = day.toISOString().split("T")[0];
                  const isCompleted = isHabitCompletedOnDate(selectedHabit, dateStr);
                  const isToday =
                    dateStr === new Date().toISOString().split("T")[0];
                  const completion = getCompletionForDate(selectedHabit, dateStr);

                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all ${
                        isCompleted
                          ? "bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-500 text-white"
                          : isToday
                          ? "bg-gray-100 dark:bg-slate-700 border-emerald-300 text-gray-700 dark:text-slate-300"
                          : "bg-gray-50 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500"
                      }`}
                      title={
                        isCompleted
                          ? `Completado em ${new Date(dateStr).toLocaleDateString("pt-BR")}`
                          : day.toLocaleDateString("pt-BR")
                      }
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Completions */}
            {selectedHabit.completions && selectedHabit.completions.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  Histórico Recente
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedHabit.completions.slice(0, 10).map((completion) => (
                    <div
                      key={completion.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircleIconSolid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            {new Date(completion.completedAt).toLocaleDateString("pt-BR", {
                              weekday: "long",
                              day: "2-digit",
                              month: "long",
                            })}
                          </p>
                          {completion.value && (
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                              Valor: {completion.value}
                            </p>
                          )}
                          {completion.notes && (
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                              {completion.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleUncompleteHabit(selectedHabit.id, completion.id)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        title="Remover"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleToggleActive(selectedHabit)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  selectedHabit.isActive
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/40"
                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/40"
                }`}
              >
                {selectedHabit.isActive ? "Desativar" : "Ativar"} Hábito
              </button>
              <button
                onClick={() => {
                  startEdit(selectedHabit);
                  setSelectedHabit(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
