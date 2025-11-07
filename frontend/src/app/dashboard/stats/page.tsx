"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiPrivate } from "@/lib/api";
import { useTimerStore } from "@/store/timer.store";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  ClockIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { PlayIcon as PlayIconSolid } from "@heroicons/react/24/solid";
import CreateTopicForm from "@/components/topics/CreateTopicForm";

interface Topic {
  id: number;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED";
  notes?: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  description?: string;
  tags?: string;
  color?: string;
}

export default function StudySessionPage() {
  const searchParams = useSearchParams();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [timerMode, setTimerMode] = useState<"pomodoro" | "custom">("pomodoro");
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [showTopicsList, setShowTopicsList] = useState(false);

  const {
    timeLeft,
    isRunning,
    linkedTopicId,
    duration,
    startTimer,
    pauseTimer,
    tick,
    resetTimer,
    saveSession,
  } = useTimerStore();

  // Carregar tópicos
  const fetchTopics = async () => {
    try {
      const response = await apiPrivate.get("/topics");
      setTopics(response.data);

      // Se não há assunto selecionado e há assuntos, selecionar o primeiro
      if (!selectedTopic && response.data.length > 0) {
        setSelectedTopic(response.data[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar assuntos:", err);
    }
  };

  // Carregar notas do tópico selecionado
  const fetchTopicNotes = async (topicId: number) => {
    try {
      setIsLoadingNotes(true);
      const response = await apiPrivate.get(`/topics/${topicId}`);
      setNotes(response.data.notes || "");
    } catch (err) {
      console.error("Erro ao carregar notas:", err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Salvar notas
  const saveNotes = async () => {
    if (!selectedTopic) return;

    try {
      setIsLoadingNotes(true);
      await apiPrivate.patch(`/topics/${selectedTopic.id}`, {
        notes: notes,
      });
      // Atualizar o tópico na lista
      setTopics((prev) =>
        prev.map((t) =>
          t.id === selectedTopic.id ? { ...t, notes: notes } : t
        )
      );
    } catch (err) {
      console.error("Erro ao salvar notas:", err);
      alert("Erro ao salvar notas. Tente novamente.");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  // Selecionar tópico da query string ou primeiro assunto
  useEffect(() => {
    if (topics.length > 0) {
      const topicIdParam = searchParams.get("topic");
      if (topicIdParam) {
        const topicId = parseInt(topicIdParam);
        const topic = topics.find((t) => t.id === topicId);
        if (topic && (!selectedTopic || selectedTopic.id !== topic.id)) {
          setSelectedTopic(topic);
          fetchTopicNotes(topic.id);
        }
      } else if (!selectedTopic) {
        // Se não houver parâmetro, seleciona o primeiro assunto
        setSelectedTopic(topics[0]);
        fetchTopicNotes(topics[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, searchParams]);

  // Quando um tópico é selecionado, carregar suas notas
  useEffect(() => {
    if (selectedTopic) {
      fetchTopicNotes(selectedTopic.id);
    } else {
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic]);

  // Timer tick effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning) {
      intervalId = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, tick]);

  // Atualizar tópico selecionado quando o timer é iniciado
  useEffect(() => {
    if (linkedTopicId) {
      const topic = topics.find((t) => t.id === linkedTopicId);
      if (topic) {
        setSelectedTopic(topic);
      }
    }
  }, [linkedTopicId, topics]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    if (!selectedTopic) {
      alert("Selecione um assunto primeiro!");
      return;
    }

    if (isRunning) {
      pauseTimer();
      return;
    }

    const minutes = timerMode === "pomodoro" ? 25 : customMinutes;
    useTimerStore.setState({ duration: minutes * 60, timeLeft: minutes * 60 });

    startTimer(selectedTopic.id, () => {
      fetchTopics();
      if (selectedTopic) {
        fetchTopicNotes(selectedTopic.id);
      }
    });
  };

  const handleStopTimer = () => {
    resetTimer();
  };

  const handleTopicCreated = () => {
    fetchTopics();
    setShowCreateTopic(false);
  };

  const handleTopicSelect = (topic: Topic) => {
    // Se há timer rodando, pausar antes de trocar
    if (isRunning) {
      pauseTimer();
    }
    setSelectedTopic(topic);
    setShowTopicsList(false);
  };

  const getStatusColor = (status: Topic["status"]) => {
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
        return "Não Iniciado";
    }
  };

  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header com Assunto Selecionado */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedTopic ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpenIcon className="w-6 h-6" />
                  <h1 className="text-2xl font-bold">{selectedTopic.name}</h1>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      selectedTopic.status === "NOT_STARTED"
                        ? "bg-white dark:bg-slate-800/20 text-white border-white/30"
                        : selectedTopic.status === "IN_PROGRESS"
                        ? "bg-blue-500 text-white border-blue-400"
                        : selectedTopic.status === "REVIEWING"
                        ? "bg-yellow-500 text-white border-yellow-400"
                        : "bg-green-500 text-white border-green-400"
                    }`}
                  >
                    {getStatusLabel(selectedTopic.status)}
                  </span>
                </div>
                <p className="text-emerald-100 text-sm">
                  {linkedTopicId && isRunning
                    ? "⏱️ Timer em execução"
                    : "Selecione um timer e comece a estudar"}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-2">Sessão de Estudos</h1>
                <p className="text-emerald-100 text-sm">
                  Selecione um assunto para começar
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTopicsList(!showTopicsList)}
              className="px-4 py-2 bg-white dark:bg-slate-800/20 hover:bg-white dark:bg-slate-800/30 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <BookOpenIcon className="w-5 h-5" />
              {topics.length} Assuntos
            </button>
            <button
              onClick={() => setShowCreateTopic(!showCreateTopic)}
              className="px-4 py-2 bg-white dark:bg-slate-800 text-emerald-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700 font-medium transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Novo
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Assuntos (Dropdown) */}
      {showTopicsList && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Meus Assuntos</h2>
            <button
              onClick={() => setShowTopicsList(false)}
              className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"
            >
              ✕
            </button>
          </div>
          {topics.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600 dark:text-slate-400" />
              <p className="text-sm mb-4">Nenhum assunto cadastrado</p>
              <button
                onClick={() => {
                  setShowTopicsList(false);
                  setShowCreateTopic(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Criar Primeiro Assunto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTopic?.id === topic.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {topic.name}
                      </p>
                      <span
                        className={`inline-block mt-2 text-xs px-2 py-1 rounded-full border ${getStatusColor(
                          topic.status
                        )}`}
                      >
                        {getStatusLabel(topic.status)}
                      </span>
                    </div>
                    {selectedTopic?.id === topic.id && (
                      <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Topic Form */}
      {showCreateTopic && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Criar Novo Assunto</h2>
            <button
              onClick={() => setShowCreateTopic(false)}
              className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"
            >
              ✕
            </button>
          </div>
          <CreateTopicForm onTopicCreated={handleTopicCreated} />
        </div>
      )}

      {!selectedTopic ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
          <BookOpenIcon className="w-16 h-16 text-gray-300 dark:text-slate-600 dark:text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
            Nenhum assunto selecionado
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
            Selecione um assunto da lista ou crie um novo para começar a estudar
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowTopicsList(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Ver Assuntos
            </button>
            <button
              onClick={() => setShowCreateTopic(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Criar Assunto
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Section - Central */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-slate-700 p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => setTimerMode("pomodoro")}
                    disabled={isRunning}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      timerMode === "pomodoro"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 dark:bg-slate-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Pomodoro
                    <span className="block text-xs font-normal mt-1">25 min</span>
                  </button>
                  <button
                    onClick={() => setTimerMode("custom")}
                    disabled={isRunning}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      timerMode === "custom"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 dark:bg-slate-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Personalizado
                    <span className="block text-xs font-normal mt-1">
                      {customMinutes} min
                    </span>
                  </button>
                </div>

                {timerMode === "custom" && !isRunning && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Duração (minutos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 25)}
                      className="w-32 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <div className="relative w-72 h-72 flex items-center justify-center">
                    <svg
                      className="absolute inset-0 transform -rotate-90"
                      width="288"
                      height="288"
                      viewBox="0 0 288 288"
                    >
                      {/* Círculo de fundo */}
                      <circle
                        cx="144"
                        cy="144"
                        r="136"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="text-slate-200"
                      />
                      {/* Círculo de progresso */}
                      <circle
                        cx="144"
                        cy="144"
                        r="136"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeLinecap="round"
                        className="text-emerald-600"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 136}`,
                          strokeDashoffset: `${2 * Math.PI * 136 * (1 - progress / 100)}`,
                          transition: 'stroke-dashoffset 0.5s ease-out',
                        }}
                      />
                    </svg>
                    <div className="relative z-10 text-center">
                      <div className="text-7xl font-bold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
                        {formatTime(timeLeft)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {isRunning ? "⏱️ Em execução" : "Pausado"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-4">
                {!isRunning && !linkedTopicId ? (
                  <button
                    onClick={handleStartTimer}
                    className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <PlayIconSolid className="w-7 h-7" />
                    Iniciar Timer
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleStartTimer}
                      className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                      {isRunning ? (
                        <>
                          <PauseIcon className="w-7 h-7" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <PlayIconSolid className="w-7 h-7" />
                          Continuar
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleStopTimer}
                      className="flex items-center gap-3 px-8 py-4 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                    >
                      <StopIcon className="w-7 h-7" />
                      Parar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                Notas
              </h2>
              {isLoadingNotes && (
                <span className="text-xs text-gray-500 dark:text-slate-400">Salvando...</span>
              )}
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                <p className="font-medium">Assunto: {selectedTopic.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Suas anotações sobre este assunto
                </p>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Digite suas notas sobre este assunto aqui..."
                rows={20}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
              />
              <div className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 p-3 rounded-lg">
                <p>💡 As notas são salvas automaticamente quando você sai do campo</p>
                <p className="mt-1">
                  📝 Use este espaço para anotações rápidas durante o estudo
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
