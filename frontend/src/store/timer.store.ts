"use client";

import { create } from "zustand";
import { apiPrivate } from "@/lib/api";
import { analytics } from "@/lib/analytics";

interface TimerState {
  duration: number;
  timeLeft: number;
  isRunning: boolean;
  linkedTopicId: number | null;
  onFinishCallback: (() => void) | null;

  startTimer: (topicId: number, onFinish: () => void) => void;
  tick: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  saveSession: () => Promise<void>;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  duration: 25 * 60,
  timeLeft: 25 * 60,
  isRunning: false,
  linkedTopicId: null,
  onFinishCallback: null,

  startTimer: (topicId, onFinish) => {
    if (get().isRunning) return;

    set({
      isRunning: true,
      linkedTopicId: topicId,
      onFinishCallback: onFinish,
      timeLeft: get().duration,
    });

    // Track session start
    analytics.trackStudySessionStarted(topicId);
  },

  tick: () => {
    if (!get().isRunning) return;

    set((state) => ({ timeLeft: state.timeLeft - 1 }));

    if (get().timeLeft <= 0) {
      set({ isRunning: false, timeLeft: get().duration });
      get().saveSession();
      console.log("POMODORO CONCLUÍDO!");
    }
  },

  pauseTimer: () => {
    const { linkedTopicId } = get();
    set({ isRunning: false });

    // Track session pause
    if (linkedTopicId) {
      analytics.trackStudySessionPaused(linkedTopicId);
    }
  },

  resetTimer: () => {
    const { linkedTopicId } = get();
    set({
      isRunning: false,
      timeLeft: get().duration,
      linkedTopicId: null,
      onFinishCallback: null,
    });

    // Track session stop
    if (linkedTopicId) {
      analytics.trackStudySessionStopped(linkedTopicId);
    }
  },

  saveSession: async () => {
    const { linkedTopicId, duration, onFinishCallback } = get();
    if (!linkedTopicId) return;

    try {
      const durationInMinutes = Math.floor(duration / 60);

      await apiPrivate.post("/study-sessions", {
        duration: durationInMinutes,
        topicId: linkedTopicId,
      });

      // Track session completion
      analytics.trackStudySessionCompleted(linkedTopicId, durationInMinutes * 60);

      if (onFinishCallback) {
        onFinishCallback();
      }
    } catch (err) {
      console.error("Falha ao salvar sessão de estudo", err);
    } finally {
      set({ linkedTopicId: null, onFinishCallback: null });
    }
  },
}));
