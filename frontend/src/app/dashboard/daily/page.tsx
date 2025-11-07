"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiPrivate } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import {
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  StarIcon,
  AcademicCapIcon,
  FireIcon,
  LightBulbIcon,
  BookOpenIcon,
  TrophyIcon,
  SparklesIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

interface AdvancedMetrics {
  date: string;
  basic: {
    totalMinutes: number;
    sessionCount: number;
    avgSessionDuration: number;
    topicsStudied: number;
  };
  temporal: {
    hourlyDistribution: Array<{
      hour: number;
      minutes: number;
      sessionCount: number;
    }>;
    peakHours: number[];
    avgInterval: number;
  };
  comparison: {
    vsHistoricalAverage: number;
    vsHistoricalAveragePercent: number;
    vsLast7Days: number;
    vsLast7DaysPercent: number;
    trend: "up" | "down" | "stable";
  };
  analysis: {
    diversityScore: number;
    efficiency: number;
    consistencyScore: number;
    weeklyGrowth: number;
  };
  prediction: {
    tomorrowPrediction: number;
  };
  byTopic: Array<{
    topicId: number;
    topicName: string;
    sessionCount: number;
    totalMinutes: number;
    percentage: number;
  }>;
}

interface AnalyticsData {
  daily: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    totalSessionDuration: number;
    pagesByPath: Record<string, number>;
    featuresByType: Record<string, number>;
  };
  weekly: {
    period: { startDate: string; endDate: string };
    totalEvents: number;
    dailyStats: Array<{
      date: string;
      totalEvents: number;
      sessionDuration: number;
      topicsCreated: number;
      flashcardsReviewed: number;
      habitsCompleted: number;
    }>;
  };
  features: {
    period: { startDate: string; endDate: string };
    featureCounts: Record<string, number>;
    featureDurations: Record<string, number>;
    eventTypeCounts: Record<string, number>;
    totalEvents: number;
  };
  engagement: {
    period: { startDate: string; endDate: string };
    activeDays: number;
    totalDays: number;
    engagementRate: number;
    studySessions: number;
    totalStudyTime: number;
    totalInteractions: number;
    uniqueFeatures: number;
    maxConsecutiveDays: number;
    currentStreak: number;
    averageEventsPerDay: number;
  };
}

export default function DailyStudyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    analytics.trackPageView("/dashboard/daily", "Meu Estudo Diário");
    analytics.trackFeatureAccessed("daily_analytics");
  }, []);

  const fetchAdvancedMetrics = async (date?: string) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("stats", "advanced");
      if (date) params.append("date", date);

      const response = await apiPrivate.get(`/study-sessions?${params.toString()}`);
      const data = response.data || {};

      setMetrics({
        date: data.date || date || new Date().toISOString().split("T")[0],
        basic: {
          totalMinutes: data.basic?.totalMinutes || 0,
          sessionCount: data.basic?.sessionCount || 0,
          avgSessionDuration: data.basic?.avgSessionDuration || 0,
          topicsStudied: data.basic?.topicsStudied || 0,
        },
        temporal: {
          hourlyDistribution:
            data.temporal?.hourlyDistribution ||
            Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              minutes: 0,
              sessionCount: 0,
            })),
          peakHours: data.temporal?.peakHours || [],
          avgInterval: data.temporal?.avgInterval || 0,
        },
        comparison: {
          vsHistoricalAverage: data.comparison?.vsHistoricalAverage || 0,
          vsHistoricalAveragePercent:
            data.comparison?.vsHistoricalAveragePercent || 0,
          vsLast7Days: data.comparison?.vsLast7Days || 0,
          vsLast7DaysPercent: data.comparison?.vsLast7DaysPercent || 0,
          trend: data.comparison?.trend || "stable",
        },
        analysis: {
          diversityScore: data.analysis?.diversityScore || 0,
          efficiency: data.analysis?.efficiency || 0,
          consistencyScore: data.analysis?.consistencyScore || 0,
          weeklyGrowth: data.analysis?.weeklyGrowth || 0,
        },
        prediction: {
          tomorrowPrediction: data.prediction?.tomorrowPrediction || 0,
        },
        byTopic: data.byTopic || [],
      });
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const [dailyRes, weeklyRes, featuresRes, engagementRes] = await Promise.all([
        apiPrivate.get(`/analytics/daily?date=${selectedDate}`),
        apiPrivate.get("/analytics/weekly?days=7"),
        apiPrivate.get("/analytics/features?days=30"),
        apiPrivate.get("/analytics/engagement?days=30"),
      ]);

      setAnalyticsData({
        daily: dailyRes.data || {
          totalEvents: 0,
          eventsByType: {},
          totalSessionDuration: 0,
          pagesByPath: {},
          featuresByType: {},
        },
        weekly: weeklyRes.data || {
          period: { startDate: "", endDate: "" },
          totalEvents: 0,
          dailyStats: [],
        },
        features: featuresRes.data || {
          period: { startDate: "", endDate: "" },
          featureCounts: {},
          featureDurations: {},
          eventTypeCounts: {},
          totalEvents: 0,
        },
        engagement: engagementRes.data || {
          period: { startDate: "", endDate: "" },
          activeDays: 0,
          totalDays: 30,
          engagementRate: 0,
          studySessions: 0,
          totalStudyTime: 0,
          totalInteractions: 0,
          uniqueFeatures: 0,
          maxConsecutiveDays: 0,
          currentStreak: 0,
          averageEventsPerDay: 0,
        },
      });
    } catch (err) {
      console.error("Erro ao carregar analytics:", err);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const params = new URLSearchParams();
      params.append("stats", "weekly");
      params.append("days", "30");

      const response = await apiPrivate.get(`/study-sessions?${params.toString()}`);
      const stats = Array.isArray(response.data) ? response.data : [];
      setWeeklyStats(
        stats.map((stat: any) => ({
          ...stat,
          byTopic: stat.byTopic || [],
          totalMinutes: stat.totalMinutes || 0,
          sessionCount: stat.sessionCount || 0,
          topicsStudied: stat.topicsStudied || 0,
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar estatísticas semanais:", err);
      setWeeklyStats([]);
    }
  };

  useEffect(() => {
    fetchAdvancedMetrics(selectedDate);
    fetchAnalyticsData();
    fetchWeeklyStats();
  }, [selectedDate]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      "from-emerald-500 to-emerald-600",
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-pink-500 to-pink-600",
      "from-orange-500 to-orange-600",
      "from-indigo-500 to-indigo-600",
      "from-cyan-500 to-cyan-600",
      "from-rose-500 to-rose-600",
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Carregando analytics...</p>
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
            Meu Estudo Diário
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            Analytics completos e insights sobre seu desempenho de estudos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "day" | "week" | "month")}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="day">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ClockIcon className="w-8 h-8 opacity-90" />
            <span className="text-2xl font-bold tracking-tight">
              {metrics ? formatTime(metrics.basic.totalMinutes) : "0min"}
            </span>
          </div>
          <p className="text-sm opacity-90">Tempo Total de Estudo</p>
          {metrics && metrics.comparison.trend === "up" && (
            <p className="text-xs mt-2 opacity-75">
              ↑ {Math.abs(metrics.comparison.vsLast7DaysPercent).toFixed(1)}% vs média
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="w-8 h-8 opacity-90" />
            <span className="text-2xl font-bold tracking-tight">
              {metrics ? metrics.basic.sessionCount : 0}
            </span>
          </div>
          <p className="text-sm opacity-90">Sessões Completas</p>
          {metrics && metrics.basic.avgSessionDuration > 0 && (
            <p className="text-xs mt-2 opacity-75">
              Média: {formatTime(metrics.basic.avgSessionDuration)}
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AcademicCapIcon className="w-8 h-8 opacity-90" />
            <span className="text-2xl font-bold tracking-tight">
              {metrics ? metrics.basic.topicsStudied : 0}
            </span>
          </div>
          <p className="text-sm opacity-90">Assuntos Estudados</p>
          {metrics && metrics.analysis.diversityScore > 0 && (
            <p className="text-xs mt-2 opacity-75">
              Diversidade: {metrics.analysis.diversityScore}%
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FireIcon className="w-8 h-8 opacity-90" />
            <span className="text-2xl font-bold tracking-tight">
              {analyticsData?.engagement.currentStreak || 0}
            </span>
          </div>
          <p className="text-sm opacity-90">Dias Consecutivos</p>
          {analyticsData && analyticsData.engagement.maxConsecutiveDays > 0 && (
            <p className="text-xs mt-2 opacity-75">
              Melhor: {analyticsData.engagement.maxConsecutiveDays} dias
            </p>
          )}
        </div>
      </div>

      {/* Gráfico 1: Tempo por Assunto (Pizza/Donut) */}
      {metrics && metrics.byTopic.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <BookOpenIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Distribuição de Tempo por Assunto
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de Pizza SVG */}
            <div className="flex items-center justify-center">
              <svg width="280" height="280" viewBox="0 0 280 280" className="max-w-full">
                <circle
                  cx="140"
                  cy="140"
                  r="100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="40"
                />
                {(() => {
                  const total = metrics.byTopic.reduce(
                    (sum, topic) => sum + topic.totalMinutes,
                    1
                  );
                  let currentAngle = -90;
                  return metrics.byTopic.map((topic, idx) => {
                    const percentage = (topic.totalMinutes / total) * 100;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle = endAngle;

                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;
                    const largeArc = angle > 180 ? 1 : 0;

                    const x1 = 140 + 100 * Math.cos(startAngleRad);
                    const y1 = 140 + 100 * Math.sin(startAngleRad);
                    const x2 = 140 + 100 * Math.cos(endAngleRad);
                    const y2 = 140 + 100 * Math.sin(endAngleRad);

                    return (
                      <path
                        key={topic.topicId}
                        d={`M 140 140 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        className={`fill-gradient-to-r ${getColorForIndex(idx)}`}
                        style={{
                          fill: `url(#gradient-${idx})`,
                        }}
                      />
                    );
                  });
                })()}
                {metrics.byTopic.map((_, idx) => (
                  <defs key={idx}>
                    <linearGradient
                      id={`gradient-${idx}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor={
                          [
                            "#10b981",
                            "#3b82f6",
                            "#8b5cf6",
                            "#ec4899",
                            "#f97316",
                            "#6366f1",
                            "#06b6d4",
                            "#f43f5e",
                          ][idx % 8]
                        }
                      />
                      <stop
                        offset="100%"
                        stopColor={
                          [
                            "#059669",
                            "#2563eb",
                            "#7c3aed",
                            "#db2777",
                            "#ea580c",
                            "#4f46e5",
                            "#0891b2",
                            "#e11d48",
                          ][idx % 8]
                        }
                      />
                    </linearGradient>
                  </defs>
                ))}
                <circle
                  cx="140"
                  cy="140"
                  r="60"
                  fill="white"
                />
                <text
                  x="140"
                  y="135"
                  textAnchor="middle"
                  className="text-2xl font-bold fill-slate-900"
                >
                  {metrics.byTopic.length}
                </text>
                <text
                  x="140"
                  y="155"
                  textAnchor="middle"
                  className="text-sm fill-slate-600"
                >
                  Assuntos
                </text>
              </svg>
            </div>

            {/* Legenda */}
            <div className="space-y-3">
              {metrics.byTopic
                .sort((a, b) => b.totalMinutes - a.totalMinutes)
                .map((topic, idx) => {
                  const total = metrics.byTopic.reduce(
                    (sum, t) => sum + t.totalMinutes,
                    1
                  );
                  const percentage = (topic.totalMinutes / total) * 100;
                  const colorIndex = metrics.byTopic
                    .sort((a, b) => b.totalMinutes - a.totalMinutes)
                    .findIndex((t) => t.topicId === topic.topicId);

                  return (
                    <div key={topic.topicId} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${
                            [
                              "#10b981",
                              "#3b82f6",
                              "#8b5cf6",
                              "#ec4899",
                              "#f97316",
                              "#6366f1",
                              "#06b6d4",
                              "#f43f5e",
                            ][colorIndex % 8]
                          } 0%, ${
                            [
                              "#059669",
                              "#2563eb",
                              "#7c3aed",
                              "#db2777",
                              "#ea580c",
                              "#4f46e5",
                              "#0891b2",
                              "#e11d48",
                            ][colorIndex % 8]
                          } 100%)`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                            {topic.topicName}
                          </span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2">
                            {formatTime(topic.totalMinutes)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${
                                [
                                  "#10b981",
                                  "#3b82f6",
                                  "#8b5cf6",
                                  "#ec4899",
                                  "#f97316",
                                  "#6366f1",
                                  "#06b6d4",
                                  "#f43f5e",
                                ][colorIndex % 8]
                              } 0%, ${
                                [
                                  "#059669",
                                  "#2563eb",
                                  "#7c3aed",
                                  "#db2777",
                                  "#ea580c",
                                  "#4f46e5",
                                  "#0891b2",
                                  "#e11d48",
                                ][colorIndex % 8]
                              } 100%)`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {topic.sessionCount} sessões
                          </span>
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico 2: Progresso ao Longo do Tempo (Linha) */}
      {weeklyStats.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <PresentationChartLineIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Progresso dos Últimos 30 Dias
          </h2>
          <div className="h-80 relative">
            <svg width="100%" height="100%" className="overflow-visible">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0%"
                  y1={`${percent}%`}
                  x2="100%"
                  y2={`${percent}%`}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Data points and line */}
              {(() => {
                const maxMinutes = Math.max(
                  ...weeklyStats.map((s: any) => s.totalMinutes || 0),
                  1
                );
                const points = weeklyStats.slice(-30).map((stat: any, idx: number) => {
                  const x = (idx / (weeklyStats.length - 1 || 1)) * 100;
                  const y = 100 - ((stat.totalMinutes || 0) / maxMinutes) * 100;
                  return { x, y, minutes: stat.totalMinutes || 0, date: stat.date };
                });

                // Line path
                const pathData = points
                  .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x}% ${point.y}%`)
                  .join(" ");

                return (
                  <>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((point: any, idx: number) => (
                      <g key={idx}>
                        <circle
                          cx={`${point.x}%`}
                          cy={`${point.y}%`}
                          r="4"
                          fill="#10b981"
                          className="hover:r-6 transition-all cursor-pointer"
                        />
                        <title>
                          {new Date(point.date).toLocaleDateString("pt-BR")}:{" "}
                          {formatTime(point.minutes)}
                        </title>
                      </g>
                    ))}
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </>
                );
              })()}

              {/* Y-axis labels */}
              {(() => {
                const maxMinutes = Math.max(
                  ...weeklyStats.map((s: any) => s.totalMinutes || 0),
                  1
                );
                return [0, 25, 50, 75, 100].map((percent) => (
                  <text
                    key={percent}
                    x="0"
                    y={`${percent}%`}
                    textAnchor="start"
                    className="text-xs fill-slate-500"
                    dy="4"
                  >
                    {formatTime((maxMinutes * (100 - percent)) / 100)}
                  </text>
                ));
              })()}
            </svg>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {weeklyStats.length > 0 &&
                new Date(weeklyStats[0].date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
            </span>
            <span>
              {weeklyStats.length > 0 &&
                new Date(weeklyStats[weeklyStats.length - 1].date).toLocaleDateString(
                  "pt-BR",
                  {
                    day: "2-digit",
                    month: "short",
                  }
                )}
            </span>
          </div>
        </div>
      )}

      {/* Gráfico 3: Distribuição por Hora do Dia (Barras Horizontais Melhorado) */}
      {metrics && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <ClockIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Produtividade por Horário do Dia
          </h2>
          <div className="space-y-2">
            {metrics.temporal.hourlyDistribution
              .filter((h) => h.minutes > 0 || metrics.temporal.peakHours.includes(h.hour))
              .map((hour) => {
                const maxMinutes = Math.max(
                  ...metrics.temporal.hourlyDistribution.map((h) => h.minutes),
                  1
                );
                const percentage = (hour.minutes / maxMinutes) * 100;
                const isPeak = metrics.temporal.peakHours.includes(hour.hour);

                return (
                  <div key={hour.hour} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-slate-600 dark:text-slate-400 text-right font-medium">
                      {hour.hour.toString().padStart(2, "0")}:00
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                        <div
                          className={`h-full rounded-lg transition-all duration-500 ${
                            isPeak
                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-gradient-to-r from-emerald-500 to-teal-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                        {hour.minutes > 0 && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
                            {formatTime(hour.minutes)} • {hour.sessionCount} sessões
                          </span>
                        )}
                      </div>
                    </div>
                    {isPeak && (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-md">
                        ⭐ Pico
                      </span>
                    )}
                  </div>
                );
              })}
            {metrics.temporal.hourlyDistribution.filter(
              (h) => h.minutes > 0 || metrics.temporal.peakHours.includes(h.hour)
            ).length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">
                Nenhum dado de estudo para este dia
              </p>
            )}
          </div>
        </div>
      )}

      {/* Gráfico 4: Atividade Semanal (Barras) */}
      {analyticsData && analyticsData.weekly.dailyStats.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Atividade dos Últimos 7 Dias
          </h2>
          <div className="h-64 flex items-end gap-2">
            {analyticsData.weekly.dailyStats
              .slice(-7)
              .reverse()
              .map((day, idx) => {
                const maxEvents = Math.max(
                  ...analyticsData.weekly.dailyStats.map((d) => d.totalEvents),
                  1
                );
                const height = (day.totalEvents / maxEvents) * 100;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all hover:from-emerald-600 hover:to-teal-500 cursor-pointer shadow-sm hover:shadow-md"
                      style={{ height: `${height}%` }}
                      title={`${new Date(day.date).toLocaleDateString("pt-BR")}: ${day.totalEvents} eventos, ${formatTime(day.sessionDuration)}`}
                    />
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {day.totalEvents}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(day.date).toLocaleDateString("pt-BR", {
                          weekday: "short",
                          day: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Gráfico 5: Comparação de Assuntos (Barras Agrupadas) */}
      {metrics && metrics.byTopic.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Comparação de Assuntos - Tempo vs Sessões
          </h2>
          <div className="space-y-4">
            {metrics.byTopic
              .sort((a, b) => b.totalMinutes - a.totalMinutes)
              .map((topic, idx) => {
                const maxMinutes = Math.max(
                  ...metrics.byTopic.map((t) => t.totalMinutes),
                  1
                );
                const maxSessions = Math.max(
                  ...metrics.byTopic.map((t) => t.sessionCount),
                  1
                );
                const timePercentage = (topic.totalMinutes / maxMinutes) * 100;
                const sessionPercentage = (topic.sessionCount / maxSessions) * 100;

                return (
                  <div key={topic.topicId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        {topic.topicName}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span>{formatTime(topic.totalMinutes)}</span>
                        <span>•</span>
                        <span>{topic.sessionCount} sessões</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Tempo:</span>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                            style={{ width: `${timePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-16 text-right">
                          {topic.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Sessões:</span>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${sessionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-16 text-right">
                          {topic.sessionCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Métricas de Engajamento */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrophyIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Taxa de Engajamento
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {analyticsData.engagement.engagementRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {analyticsData.engagement.activeDays} de{" "}
              {analyticsData.engagement.totalDays} dias ativos
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Consistência
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics ? metrics.analysis.consistencyScore : 0}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Score de consistência</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-2">
              <LightBulbIcon className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Eficiência
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics ? metrics.analysis.efficiency : 0}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Score de eficiência</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-2">
              <StarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Diversidade
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics ? metrics.analysis.diversityScore : 0}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Variedade de assuntos</p>
          </div>
        </div>
      )}

      {/* Comparações e Previsões */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              vs Média Histórica
            </h3>
            <div className="flex items-center gap-3">
              {metrics.comparison.vsHistoricalAveragePercent > 0 ? (
                <ArrowTrendingUpIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowTrendingDownIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {metrics.comparison.vsHistoricalAveragePercent > 0 ? "+" : ""}
                  {metrics.comparison.vsHistoricalAveragePercent.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formatTime(Math.abs(metrics.comparison.vsHistoricalAverage))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              vs Últimos 7 Dias
            </h3>
            <div className="flex items-center gap-3">
              {metrics.comparison.vsLast7DaysPercent > 0 ? (
                <ArrowTrendingUpIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowTrendingDownIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {metrics.comparison.vsLast7DaysPercent > 0 ? "+" : ""}
                  {metrics.comparison.vsLast7DaysPercent.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formatTime(Math.abs(metrics.comparison.vsLast7Days))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Previsão para Amanhã
            </h3>
            <div className="flex items-center gap-3">
              <LightBulbIcon className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {formatTime(metrics.prediction.tomorrowPrediction)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Baseado na média</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!metrics && !analyticsData && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <ChartBarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            Nenhum dado disponível
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Comece a usar o sistema para ver seus analytics aqui
          </p>
        </div>
      )}
    </div>
  );
}

