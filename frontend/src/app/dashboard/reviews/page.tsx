"use client";

import { useEffect, useState } from "react";
import { apiPrivate } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import {
  PlusIcon,
  XMarkIcon,
  BookOpenIcon,
  LightBulbIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  nextReview: string;
  reviewCount: number;
  lastReviewed?: string;
  topic: {
    id: number;
    name: string;
  };
}

interface Topic {
  id: number;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED";
  notes?: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  description?: string;
}

interface ReviewSession {
  topicId: number;
  method: "flashcards" | "active-recall" | "feynman" | "summary" | "questions";
  notes: string;
  completedAt: string;
}

type ReviewMethod =
  | "flashcards"
  | "active-recall"
  | "feynman"
  | "summary"
  | "questions";

export default function ReviewsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewMethod, setReviewMethod] = useState<ReviewMethod>("flashcards");
  const [showCreateFlashcard, setShowCreateFlashcard] = useState(false);
  const [showOnlyDue, setShowOnlyDue] = useState(true);

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Active Recall states
  const [activeRecallQuestion, setActiveRecallQuestion] = useState("");
  const [activeRecallAnswer, setActiveRecallAnswer] = useState("");
  const [showActiveRecallAnswer, setShowActiveRecallAnswer] = useState(false);

  // Feynman states
  const [feynmanExplanation, setFeynmanExplanation] = useState("");

  // Summary states
  const [summaryText, setSummaryText] = useState("");

  // Questions states
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");

  // Review notes
  const [reviewNotes, setReviewNotes] = useState("");

  // Form states
  const [flashcardForm, setFlashcardForm] = useState({
    front: "",
    back: "",
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
  });

  // Carregar assuntos
  const fetchTopics = async () => {
    try {
      const response = await apiPrivate.get("/topics");
      setTopics(response.data);
      if (response.data.length > 0 && !selectedTopic) {
        setSelectedTopic(response.data[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar assuntos:", err);
    }
  };

  // Carregar flashcards do assunto selecionado
  const fetchFlashcards = async () => {
    if (!selectedTopic) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("topicId", selectedTopic.id.toString());
      if (showOnlyDue) params.append("due", "true");

      const response = await apiPrivate.get(`/flashcards?${params.toString()}`);
      setFlashcards(response.data);
      if (response.data.length > 0) {
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error("Erro ao carregar flashcards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchFlashcards();
      // Carregar notas do assunto
      apiPrivate
        .get(`/topics/${selectedTopic.id}`)
        .then((res) => {
          setReviewNotes(res.data.notes || "");
        })
        .catch(() => {});
    }
  }, [selectedTopic, showOnlyDue]);

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;

    try {
      const response = await apiPrivate.post("/flashcards", {
        front: flashcardForm.front,
        back: flashcardForm.back,
        topicId: selectedTopic.id,
        difficulty: flashcardForm.difficulty,
      });

      // Track flashcard creation
      if (response.data?.id) {
        analytics.trackFlashcardCreated(response.data.id, selectedTopic.id);
      }

      setFlashcardForm({ front: "", back: "", difficulty: "MEDIUM" });
      setShowCreateFlashcard(false);
      fetchFlashcards();
    } catch (err) {
      console.error("Erro ao criar flashcard:", err);
      alert("Erro ao criar flashcard. Tente novamente.");
    }
  };

  const handleReviewFlashcard = async (
    difficulty: "EASY" | "MEDIUM" | "HARD"
  ) => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return;

    try {
      await apiPrivate.post(`/flashcards/${currentCard.id}/review`, {
        difficulty,
      });

      // Track flashcard review
      analytics.trackFlashcardReviewed(
        currentCard.id,
        difficulty,
        currentCard.topic.id
      );

      // Remover card revisado ou avançar
      const newCards = flashcards.filter((c) => c.id !== currentCard.id);
      setFlashcards(newCards);

      if (newCards.length > 0) {
        setCurrentCardIndex(Math.min(currentCardIndex, newCards.length - 1));
      } else {
        setCurrentCardIndex(0);
      }
      setIsFlipped(false);
    } catch (err) {
      console.error("Erro ao revisar flashcard:", err);
    }
  };

  const handleSaveReviewNotes = async () => {
    if (!selectedTopic) return;

    try {
      await apiPrivate.patch(`/topics/${selectedTopic.id}`, {
        notes: reviewNotes,
      });
    } catch (err) {
      console.error("Erro ao salvar notas:", err);
    }
  };

  const handleDeleteFlashcard = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este flashcard?")) return;

    try {
      await apiPrivate.delete(`/flashcards/${id}`);
      fetchFlashcards();
    } catch (err) {
      console.error("Erro ao excluir flashcard:", err);
    }
  };

  const dueCards = flashcards.filter(
    (card) => new Date(card.nextReview) <= new Date()
  );

  const reviewMethods = [
    {
      id: "flashcards" as ReviewMethod,
      name: "Flashcards",
      icon: BookOpenIcon,
      description: "Revisão espaçada com cartões de pergunta e resposta",
      color: "emerald",
    },
    {
      id: "active-recall" as ReviewMethod,
      name: "Active Recall",
      icon: LightBulbIcon,
      description: "Tente lembrar sem consultar o material",
      color: "blue",
    },
    {
      id: "feynman" as ReviewMethod,
      name: "Técnica Feynman",
      icon: AcademicCapIcon,
      description: "Explique como se estivesse ensinando alguém",
      color: "purple",
    },
    {
      id: "summary" as ReviewMethod,
      name: "Resumo",
      icon: DocumentTextIcon,
      description: "Crie um resumo do que você aprendeu",
      color: "orange",
    },
    {
      id: "questions" as ReviewMethod,
      name: "Questões Práticas",
      icon: QuestionMarkCircleIcon,
      description: "Crie e responda questões sobre o assunto",
      color: "red",
    },
  ];

  const getReviewMethodInfo = () => {
    return reviewMethods.find((m) => m.id === reviewMethod);
  };

  const currentCard = flashcards[currentCardIndex];
  const methodInfo = getReviewMethodInfo();

  return (
    <div className="space-y-6">
      {/* Header com Assunto Selecionado */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedTopic ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpenIcon className="w-6 h-6" />
                  <h1 className="text-3xl font-bold">{selectedTopic.name}</h1>
                  {selectedTopic.priority && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTopic.priority === "HIGH"
                          ? "bg-red-50 dark:bg-red-900/200 text-white"
                          : selectedTopic.priority === "MEDIUM"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {selectedTopic.priority === "HIGH"
                        ? "Alta Prioridade"
                        : selectedTopic.priority === "MEDIUM"
                        ? "Média Prioridade"
                        : "Baixa Prioridade"}
                    </span>
                  )}
                </div>
                <p className="text-indigo-100 text-sm">
                  {selectedTopic.description ||
                    "Selecione um método de revisão para começar"}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2">Revisões</h1>
                <p className="text-indigo-100 text-sm">
                  Selecione um assunto para começar a revisar
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTopic?.id || ""}
              onChange={(e) => {
                const topic = topics.find(
                  (t) => t.id === parseInt(e.target.value)
                );
                setSelectedTopic(topic || null);
              }}
              className="px-4 py-2 bg-white dark:bg-slate-800/20 hover:bg-white dark:bg-slate-800/30 rounded-lg font-medium text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="">Selecione um assunto</option>
              {topics.map((topic) => (
                <option
                  key={topic.id}
                  value={topic.id}
                  className="text-gray-900 dark:text-slate-100"
                >
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedTopic ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
          <BookOpenIcon className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
            Nenhum assunto selecionado
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Selecione um assunto acima para começar a revisar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Métodos de Revisão - Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                Métodos de Revisão
              </h2>
              <div className="space-y-2">
                {reviewMethods.map((method) => {
                  const Icon = method.icon;
                  const isActive = reviewMethod === method.id;

                  const getActiveClasses = () => {
                    switch (method.color) {
                      case "emerald":
                        return isActive
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 dark:border-emerald-600"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100";
                      case "blue":
                        return isActive
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100";
                      case "purple":
                        return isActive
                          ? "bg-purple-50 border-2 border-purple-500"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100";
                      case "orange":
                        return isActive
                          ? "bg-orange-50 border-2 border-orange-500"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100";
                      case "red":
                        return isActive
                          ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100";
                      default:
                        return "bg-gray-50 border-2 border-transparent hover:bg-gray-100";
                    }
                  };

                  const getIconClasses = () => {
                    if (!isActive) return "text-gray-600 dark:text-slate-400";
                    switch (method.color) {
                      case "emerald":
                        return "text-emerald-600";
                      case "blue":
                        return "text-blue-600";
                      case "purple":
                        return "text-purple-600";
                      case "orange":
                        return "text-orange-600";
                      case "red":
                        return "text-red-600 dark:text-red-400";
                      default:
                        return "text-gray-600 dark:text-slate-400";
                    }
                  };

                  const getTextClasses = () => {
                    if (!isActive) return "text-gray-900 dark:text-slate-100";
                    switch (method.color) {
                      case "emerald":
                        return "text-emerald-900";
                      case "blue":
                        return "text-blue-900";
                      case "purple":
                        return "text-purple-900";
                      case "orange":
                        return "text-orange-900";
                      case "red":
                        return "text-red-900";
                      default:
                        return "text-gray-900 dark:text-slate-100";
                    }
                  };

                  return (
                    <button
                      key={method.id}
                      onClick={() => setReviewMethod(method.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${getActiveClasses()}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-5 h-5 ${getIconClasses()}`} />
                        <span className={`font-medium ${getTextClasses()}`}>
                          {method.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-400">
                        {method.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">
                Estatísticas
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Total de Flashcards</span>
                  <span className="font-medium">{flashcards.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Pendentes</span>
                  <span className="font-medium text-orange-600">
                    {dueCards.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Revisados Hoje</span>
                  <span className="font-medium text-green-600">
                    {
                      flashcards.filter(
                        (c) =>
                          c.lastReviewed &&
                          new Date(c.lastReviewed).toDateString() ===
                            new Date().toDateString()
                      ).length
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Dicas de Revisão */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">Dica</h3>
              </div>
              <p className="text-xs text-blue-800">
                {reviewMethod === "flashcards" &&
                  "Use a revisão espaçada: revise quando o sistema indicar para melhor retenção."}
                {reviewMethod === "active-recall" &&
                  "Tente lembrar antes de consultar. Isso fortalece a memória de longo prazo."}
                {reviewMethod === "feynman" &&
                  "Explique em termos simples. Se não conseguir, você precisa estudar mais."}
                {reviewMethod === "summary" &&
                  "Sintetize o conhecimento em suas próprias palavras para melhor compreensão."}
                {reviewMethod === "questions" &&
                  "Crie questões desafiadoras que testem seu entendimento profundo."}
              </p>
            </div>
          </div>

          {/* Área Principal de Revisão */}
          <div className="lg:col-span-3 space-y-6">
            {/* Método: Flashcards */}
            {reviewMethod === "flashcards" && (
              <div className="space-y-6">
                {/* Controles */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showOnlyDue}
                          onChange={(e) => setShowOnlyDue(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">
                          Apenas pendentes
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={() => setShowCreateFlashcard(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Novo Flashcard
                    </button>
                  </div>
                </div>

                {/* Flashcard Display */}
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                  </div>
                ) : flashcards.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                    <BookOpenIcon className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                      Nenhum flashcard encontrado
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
                      Crie flashcards para começar a revisar este assunto
                    </p>
                    <button
                      onClick={() => setShowCreateFlashcard(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Criar Primeiro Flashcard
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Card Display */}
                    <div
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-slate-700 p-12 min-h-[400px] flex items-center justify-center cursor-pointer transition-all hover:shadow-xl"
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <div className="text-center w-full">
                        {!isFlipped ? (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
                              Pergunta
                            </p>
                            <p className="text-3xl font-semibold text-gray-900 dark:text-slate-100 mb-6">
                              {currentCard?.front}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-slate-500">
                              Clique para ver a resposta
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
                              Resposta
                            </p>
                            <p className="text-2xl text-gray-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                              {currentCard?.back}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Navigation & Review */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              setCurrentCardIndex(
                                Math.max(0, currentCardIndex - 1)
                              );
                              setIsFlipped(false);
                            }}
                            disabled={currentCardIndex === 0}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            ← Anterior
                          </button>
                          <span className="text-sm text-gray-600 dark:text-slate-400">
                            {currentCardIndex + 1} de {flashcards.length}
                          </span>
                          <button
                            onClick={() => {
                              setCurrentCardIndex(
                                Math.min(
                                  flashcards.length - 1,
                                  currentCardIndex + 1
                                )
                              );
                              setIsFlipped(false);
                            }}
                            disabled={
                              currentCardIndex === flashcards.length - 1
                            }
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Próximo →
                          </button>
                        </div>
                      </div>

                      {isFlipped && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-4 text-center">
                            Como foi a revisão?
                          </p>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => handleReviewFlashcard("HARD")}
                              className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors font-medium"
                            >
                              <XCircleIcon className="w-5 h-5" />
                              Difícil
                            </button>
                            <button
                              onClick={() => handleReviewFlashcard("MEDIUM")}
                              className="flex items-center gap-2 px-6 py-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors font-medium"
                            >
                              <span className="w-5 h-5 text-center text-lg">
                                ○
                              </span>
                              Médio
                            </button>
                            <button
                              onClick={() => handleReviewFlashcard("EASY")}
                              className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                            >
                              <CheckCircleIconSolid className="w-5 h-5" />
                              Fácil
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lista de Flashcards */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                          Todos os Flashcards ({flashcards.length})
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        {flashcards.map((card, idx) => (
                          <div
                            key={card.id}
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                              idx === currentCardIndex ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
                            }`}
                            onClick={() => {
                              setCurrentCardIndex(idx);
                              setIsFlipped(false);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-slate-100 mb-1">
                                  {card.front}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-1">
                                  {card.back}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      card.difficulty === "EASY"
                                        ? "bg-green-100 text-green-700"
                                        : card.difficulty === "MEDIUM"
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                    }`}
                                  >
                                    {card.difficulty === "EASY"
                                      ? "Fácil"
                                      : card.difficulty === "MEDIUM"
                                      ? "Médio"
                                      : "Difícil"}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-slate-400">
                                    {card.reviewCount} revisões
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFlashcard(card.id);
                                }}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 dark:bg-red-900/20 rounded"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Método: Active Recall */}
            {reviewMethod === "active-recall" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-8">
                  <div className="text-center mb-6">
                    <LightBulbIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                      Active Recall
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400">
                      Tente lembrar o que você sabe sobre este assunto sem
                      consultar
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        O que você lembra sobre "{selectedTopic.name}"?
                      </label>
                      <textarea
                        value={activeRecallAnswer}
                        onChange={(e) => setActiveRecallAnswer(e.target.value)}
                        placeholder="Escreva tudo que você consegue lembrar sobre este assunto..."
                        rows={12}
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowActiveRecallAnswer(true)}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Verificar com Minhas Notas
                      </button>
                    </div>

                    {showActiveRecallAnswer && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-blue-300">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                          Suas Notas do Assunto:
                        </h3>
                        <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line">
                          {selectedTopic.notes ||
                            "Você ainda não tem notas sobre este assunto."}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-4">
                          Compare o que você escreveu com suas notas. O que você
                          esqueceu? O que você lembrou corretamente?
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Método: Técnica Feynman */}
            {reviewMethod === "feynman" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 p-8">
                  <div className="text-center mb-6">
                    <AcademicCapIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                      Técnica Feynman
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400">
                      Explique "{selectedTopic.name}" como se estivesse
                      ensinando para alguém
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Sua Explicação (use linguagem simples):
                      </label>
                      <textarea
                        value={feynmanExplanation}
                        onChange={(e) => setFeynmanExplanation(e.target.value)}
                        placeholder="Explique este assunto de forma simples, como se estivesse ensinando uma criança ou alguém que nunca ouviu falar sobre isso..."
                        rows={15}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                        💡 Dica da Técnica Feynman:
                      </h3>
                      <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                        <li>Use linguagem simples e direta</li>
                        <li>Evite jargões técnicos</li>
                        <li>
                          Se você não conseguir explicar de forma simples, você
                          precisa estudar mais
                        </li>
                        <li>
                          Identifique os pontos que você não consegue explicar
                          claramente
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Método: Resumo */}
            {reviewMethod === "summary" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200 p-8">
                  <div className="text-center mb-6">
                    <DocumentTextIcon className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                      Criar Resumo
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400">
                      Sintetize o conhecimento sobre "{selectedTopic.name}" em
                      suas próprias palavras
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Seu Resumo:
                      </label>
                      <textarea
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        placeholder="Escreva um resumo completo do assunto, destacando os pontos principais, conceitos-chave e conexões importantes..."
                        rows={18}
                        className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                        {summaryText.length} caracteres
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-orange-200">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                        📝 Dicas para um bom resumo:
                      </h3>
                      <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                        <li>Organize por tópicos principais</li>
                        <li>Use suas próprias palavras</li>
                        <li>Destaque conceitos-chave e definições</li>
                        <li>Inclua exemplos práticos</li>
                        <li>
                          Faça conexões entre diferentes partes do assunto
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Método: Questões Práticas */}
            {reviewMethod === "questions" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border-2 border-red-200 p-8">
                  <div className="text-center mb-6">
                    <QuestionMarkCircleIcon className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                      Questões Práticas
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400">
                      Crie e responda questões desafiadoras sobre "
                      {selectedTopic.name}"
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Questão:
                      </label>
                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Crie uma questão desafiadora sobre este assunto..."
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:border-red-600 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Sua Resposta:
                      </label>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Responda a questão de forma completa e detalhada..."
                        rows={10}
                        className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:border-red-600 resize-none"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-red-200">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                        🎯 Dicas para questões eficazes:
                      </h3>
                      <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                        <li>
                          Crie questões que testem compreensão, não apenas
                          memorização
                        </li>
                        <li>Inclua questões de aplicação prática</li>
                        <li>Faça questões que conectem diferentes conceitos</li>
                        <li>
                          Questões "por quê?" e "como?" são mais eficazes que "o
                          quê?"
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notas de Revisão - Sempre visível */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <PencilIcon className="w-5 h-5" />
                  Notas de Revisão
                </h3>
                <button
                  onClick={handleSaveReviewNotes}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  Salvar
                </button>
              </div>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                onBlur={handleSaveReviewNotes}
                placeholder="Anote insights, dificuldades, pontos importantes descobertos durante a revisão..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                💡 As notas são salvas automaticamente quando você sai do campo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Flashcard */}
      {showCreateFlashcard && selectedTopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Novo Flashcard</h2>
              <button
                onClick={() => setShowCreateFlashcard(false)}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateFlashcard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Frente (Pergunta)
                </label>
                <textarea
                  value={flashcardForm.front}
                  onChange={(e) =>
                    setFlashcardForm({
                      ...flashcardForm,
                      front: e.target.value,
                    })
                  }
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: O que é SOLID?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Verso (Resposta)
                </label>
                <textarea
                  value={flashcardForm.back}
                  onChange={(e) =>
                    setFlashcardForm({ ...flashcardForm, back: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: SOLID são 5 princípios..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Dificuldade Inicial
                </label>
                <select
                  value={flashcardForm.difficulty}
                  onChange={(e) =>
                    setFlashcardForm({
                      ...flashcardForm,
                      difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="EASY">Fácil</option>
                  <option value="MEDIUM">Médio</option>
                  <option value="HARD">Difícil</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateFlashcard(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 rounded-md hover:bg-gray-50"
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
