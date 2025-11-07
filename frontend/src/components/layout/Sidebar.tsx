"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  HomeIcon,
  ClockIcon,
  CalendarIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  ChartBarIcon,
  ChevronDownIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "@/store/auth.store";
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

interface SidebarProps {
  topics: Topic[];
  onTopicCreated: () => void;
}

export default function Sidebar({ topics, onTopicCreated }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isEditaisExpanded, setIsEditaisExpanded] = useState(true);
  const [showCreateTopicForm, setShowCreateTopicForm] = useState(false);

  const navigationItems = [
    { name: "Página Inicial", icon: HomeIcon, path: "/dashboard" },
    { name: "Meu Estudo Diário", icon: ClockIcon, path: "/dashboard/daily" },
    { name: "Calendário", icon: CalendarIcon, path: "/dashboard/calendar" },
    { name: "Sessão de Estudos", icon: Squares2X2Icon, path: "/dashboard/stats" },
    { name: "Revisões", icon: ArrowPathIcon, path: "/dashboard/reviews" },
    {
      name: "Hábitos",
      icon: ChartBarIcon,
      path: "/dashboard/habits",
    },
    {
      name: "Sugestões",
      icon: ChatBubbleLeftRightIcon,
      path: "/dashboard/suggestions",
    },
  ];

  const handleTopicCreated = () => {
    setShowCreateTopicForm(false);
    onTopicCreated();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };


  const getStatusColor = (status: Topic["status"]) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-amber-400";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "REVIEWING":
        return "bg-orange-500";
      case "COMPLETED":
        return "bg-emerald-500";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm z-30 transition-colors">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">✓</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Plano Mestre</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <button
                  onClick={() => {
                    router.push(item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium relative group ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? "text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  />
                  <span className="flex-1 text-left whitespace-nowrap">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* MEUS ASSUNTOS Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3 px-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Meus Assuntos
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateTopicForm(!showCreateTopicForm)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Adicionar novo assunto"
              >
                <PlusIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={() => setIsEditaisExpanded(!isEditaisExpanded)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronDownIcon
                  className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${
                    isEditaisExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Create Topic Form */}
          {showCreateTopicForm && (
            <div className="mb-3 px-3">
              <CreateTopicForm
                onTopicCreated={handleTopicCreated}
                isExpanded={false}
              />
            </div>
          )}

          {isEditaisExpanded && (
            <ul className="space-y-1">
              {topics.length > 0 ? (
                topics.map((topic) => (
                  <li key={topic.id}>
                    <button
                      onClick={() => router.push(`/dashboard/topics/${topic.id}`)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          topic.status
                        )} flex-shrink-0`}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100">
                        {topic.name}
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  Nenhum assunto cadastrado
                </li>
              )}
            </ul>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {user?.name || "Usuário"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
