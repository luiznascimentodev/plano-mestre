"use client";

import {
  DocumentTextIcon,
  Squares2X2Icon,
  FolderIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface StatisticsCardsProps {
  totalTopics: number;
  totalSessions: number;
  completedTopics: number;
}

export default function StatisticsCards({
  totalTopics,
  totalSessions,
  completedTopics,
}: StatisticsCardsProps) {
  const completedPercentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const cards = [
    {
      title: "Meus assuntos",
      value: totalTopics.toString(),
      icon: DocumentTextIcon,
      color: "bg-blue-500",
    },
    {
      title: "Sessões",
      value: totalSessions.toString(),
      icon: Squares2X2Icon,
      color: "bg-orange-500",
    },
    {
      title: "Assuntos",
      value: totalTopics.toString(),
      icon: FolderIcon,
      color: "bg-red-500",
    },
    {
      title: "Assuntos vistos",
      value: `${completedTopics} (${completedPercentage}%)`,
      icon: CheckCircleIcon,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

