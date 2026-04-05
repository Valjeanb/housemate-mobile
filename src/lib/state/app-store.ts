// Roxley House Sitter Hub - Main Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, CompletionLog, SeasonProfile, UserRole, Category, DEFAULT_CATEGORIES, HowToGuide } from '../types';
import { seedTasks } from '../seed-tasks';
import * as api from '../api';

interface AppStore {
  // User & Role
  userRole: UserRole;
  userName: string;
  setUserRole: (role: UserRole) => void;
  setUserName: (name: string) => void;

  // Season Profile
  currentSeason: SeasonProfile;
  setSeason: (season: SeasonProfile) => void;

  // Categories
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (categoryId: string) => void;
  reorderCategories: (categories: Category[]) => void;

  // How-To Guides
  howToGuides: HowToGuide[];
  addHowToGuide: (guide: HowToGuide) => void;
  updateHowToGuide: (guideId: string, updates: Partial<HowToGuide>) => void;
  deleteHowToGuide: (guideId: string) => void;
  getGuidesForTask: (taskId: string) => HowToGuide[];

  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskActive: (taskId: string) => void;

  // Completions - keyed by date string (YYYY-MM-DD)
  dailyCompletions: Record<string, string[]>; // date -> array of completed task IDs
  completionLogs: CompletionLog[];

  // Actions for completions
  completeTask: (taskId: string, notes?: string, photoUrls?: string[], flaggedNeedsAttention?: boolean) => void;
  uncompleteTask: (taskId: string) => void;
  isTaskCompletedToday: (taskId: string) => boolean;
  isTaskCompletedThisWeek: (taskId: string) => boolean;
  getCompletionLogsForTask: (taskId: string) => CompletionLog[];
  getNeedsAttentionLogs: () => CompletionLog[];

  // Helpers
  getActiveTasks: () => Task[];
  getDailyTasks: () => Task[];
  getWeeklyTasks: () => Task[];
  getTodaysTasks: () => Task[]; // Includes daily + custom tasks due today
  isCustomTaskDue: (taskId: string) => boolean;
  getTodayCompletionRate: () => number;
  getWeekCompletionRate: () => number;
  getMissedCriticalTasks: () => Task[];

  // Initialize with seed data
  initializeWithSeedData: () => void;

  // Reset to default tasks
  resetToDefaultTasks: () => void;

  // Server sync
  isOnline: boolean;
  lastSyncAt: string | null;
  aiGeneratedTask: Partial<Task> | null;
  setAiGeneratedTask: (task: Partial<Task> | null) => void;
  syncFromServer: (data: api.SyncResponse) => void;
  mergeSyncUpdate: (data: api.SyncSinceResponse) => void;
}

// Helper to get today's date string
const getTodayString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper to get start of week (Monday)
const getWeekStartString = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
};

// Helper to check if date is in current week
const isInCurrentWeek = (dateString: string) => {
  const date = new Date(dateString);
  const weekStart = new Date(getWeekStartString());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= weekStart && date < weekEnd;
};

// Helper to get the most recent completion date for a task
const getLastCompletionDate = (
  taskId: string,
  dailyCompletions: Record<string, string[]>
): string | null => {
  const dates = Object.keys(dailyCompletions)
    .filter((date) => dailyCompletions[date].includes(taskId))
    .sort()
    .reverse();
  return dates.length > 0 ? dates[0] : null;
};

// Helper to check if a custom-interval task is due today
const isCustomTaskDueToday = (
  task: Task,
  dailyCompletions: Record<string, string[]>
): boolean => {
  if (task.frequency !== 'custom' || !task.customIntervalDays) return false;

  const lastCompletion = getLastCompletionDate(task.id, dailyCompletions);

  // If never completed, it's due today
  if (!lastCompletion) return true;

  const lastDate = new Date(lastCompletion);
  const today = new Date(getTodayString());

  // Calculate days since last completion
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Due if interval days have passed
  return diffDays >= task.customIntervalDays;
};

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      userRole: 'sitter',
      userName: 'House Sitter',
      currentSeason: 'summer',
      categories: DEFAULT_CATEGORIES,
      howToGuides: [],
      tasks: [],
      dailyCompletions: {},
      completionLogs: [],
      isOnline: false,
      lastSyncAt: null,
      aiGeneratedTask: null,
      setAiGeneratedTask: (task) => set({ aiGeneratedTask: task }),

      // Setters
      setUserRole: (role) => set({ userRole: role }),
      setUserName: (name) => set({ userName: name }),
      setSeason: (season) => {
        // When season changes, update task visibility based on seasonProfiles
        const tasks = get().tasks.map((task) => {
          if (task.seasonProfiles && task.seasonProfiles.length > 0) {
            return {
              ...task,
              isActive: task.seasonProfiles.includes(season),
            };
          }
          return task;
        });
        set({ currentSeason: season, tasks });
      },

      // Category management
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (categoryId, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === categoryId ? { ...c, ...updates } : c
          ),
        })),
      deleteCategory: (categoryId) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== categoryId),
        })),
      reorderCategories: (categories) => set({ categories }),

      // How-To Guide management
      addHowToGuide: (guide) =>
        set((state) => ({ howToGuides: [...state.howToGuides, guide] })),
      updateHowToGuide: (guideId, updates) =>
        set((state) => ({
          howToGuides: state.howToGuides.map((g) =>
            g.id === guideId ? { ...g, ...updates } : g
          ),
        })),
      deleteHowToGuide: (guideId) =>
        set((state) => ({
          howToGuides: state.howToGuides.filter((g) => g.id !== guideId),
          // Also remove this guide from any tasks that reference it
          tasks: state.tasks.map((t) => ({
            ...t,
            howToGuideIds: t.howToGuideIds?.filter((id) => id !== guideId),
          })),
        })),
      getGuidesForTask: (taskId) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task?.howToGuideIds) return [];
        return state.howToGuides.filter((g) => task.howToGuideIds?.includes(g.id));
      },

      // Task management
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
        })),
      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        })),
      toggleTaskActive: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, isActive: !t.isActive } : t
          ),
        })),

      // Completion actions — optimistic update + API call
      completeTask: (taskId, notes, photoUrls, flaggedNeedsAttention = false) => {
        const today = getTodayString();
        const now = new Date().toISOString();
        const { userName, userRole } = get();

        const newLog: CompletionLog = {
          id: `${taskId}-${now}`,
          taskId,
          completedAt: now,
          completedBy: userName,
          notes,
          photoUrls,
          flaggedNeedsAttention,
        };

        // Optimistic local update
        set((state) => {
          const todayCompletions = state.dailyCompletions[today] || [];
          return {
            dailyCompletions: {
              ...state.dailyCompletions,
              [today]: [...todayCompletions, taskId],
            },
            completionLogs: [...state.completionLogs, newLog],
          };
        });

        // Fire API call (fire-and-forget with error logging)
        api.completeTaskApi({
          taskId,
          date: today,
          notes,
          photoUrls,
          flaggedNeedsAttention,
        }, userRole, userName).catch((err) => {
          console.warn('Failed to sync completion to server:', err.message);
        });
      },

      uncompleteTask: (taskId) => {
        const today = getTodayString();
        const { userName, userRole } = get();

        // Optimistic local update
        set((state) => {
          const todayCompletions = state.dailyCompletions[today] || [];
          return {
            dailyCompletions: {
              ...state.dailyCompletions,
              [today]: todayCompletions.filter((id) => id !== taskId),
            },
          };
        });

        // Fire API call
        api.uncompleteTaskApi(taskId, today, userRole, userName).catch((err) => {
          console.warn('Failed to sync uncomplete to server:', err.message);
        });
      },

      isTaskCompletedToday: (taskId) => {
        const today = getTodayString();
        const completions = get().dailyCompletions[today] || [];
        return completions.includes(taskId);
      },

      isTaskCompletedThisWeek: (taskId) => {
        const state = get();
        const weekStart = getWeekStartString();

        // Check all days in current week
        for (const [date, completions] of Object.entries(state.dailyCompletions)) {
          if (isInCurrentWeek(date) && completions.includes(taskId)) {
            return true;
          }
        }
        return false;
      },

      getCompletionLogsForTask: (taskId) => {
        return get().completionLogs.filter((log) => log.taskId === taskId);
      },

      getNeedsAttentionLogs: () => {
        return get().completionLogs.filter((log) => log.flaggedNeedsAttention);
      },

      // Getters
      getActiveTasks: () => {
        return get().tasks.filter((t) => t.isActive);
      },

      getDailyTasks: () => {
        return get().tasks.filter((t) => t.isActive && t.frequency === 'daily');
      },

      getWeeklyTasks: () => {
        return get().tasks.filter((t) => t.isActive && t.frequency === 'weekly');
      },

      getTodaysTasks: () => {
        const state = get();
        return state.tasks.filter((t) => {
          if (!t.isActive) return false;
          // Include daily tasks
          if (t.frequency === 'daily') return true;
          // Include custom tasks that are due today
          if (t.frequency === 'custom') {
            return isCustomTaskDueToday(t, state.dailyCompletions);
          }
          return false;
        });
      },

      isCustomTaskDue: (taskId) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return false;
        return isCustomTaskDueToday(task, state.dailyCompletions);
      },

      getTodayCompletionRate: () => {
        const dailyTasks = get().getDailyTasks();
        if (dailyTasks.length === 0) return 100;

        const completedCount = dailyTasks.filter((t) =>
          get().isTaskCompletedToday(t.id)
        ).length;

        return Math.round((completedCount / dailyTasks.length) * 100);
      },

      getWeekCompletionRate: () => {
        const weeklyTasks = get().getWeeklyTasks();
        if (weeklyTasks.length === 0) return 100;

        const completedCount = weeklyTasks.filter((t) =>
          get().isTaskCompletedThisWeek(t.id)
        ).length;

        return Math.round((completedCount / weeklyTasks.length) * 100);
      },

      getMissedCriticalTasks: () => {
        return get()
          .getDailyTasks()
          .filter(
            (t) => t.priority === 'critical' && !get().isTaskCompletedToday(t.id)
          );
      },

      initializeWithSeedData: () => {
        const currentTasks = get().tasks;
        if (currentTasks.length === 0) {
          set({ tasks: seedTasks });
        }
      },

      resetToDefaultTasks: () => {
        set({ tasks: seedTasks, dailyCompletions: {}, completionLogs: [] });
      },

      // Server sync — replaces local state with server data
      syncFromServer: (data) => {
        set({
          tasks: data.tasks,
          categories: data.categories.map((c: any) => ({
            id: c.id,
            label: c.label,
            color: c.color,
            icon: c.icon,
          })),
          dailyCompletions: data.dailyCompletions,
          completionLogs: data.completionLogs,
          currentSeason: data.currentSeason as SeasonProfile,
          isOnline: true,
          lastSyncAt: data.lastModified,
        });
      },

      // Merge incremental sync update
      mergeSyncUpdate: (data) => {
        if (!data.changed) return;

        set((state) => {
          const updates: Partial<AppStore> = {
            isOnline: true,
            lastSyncAt: data.lastModified,
          };

          // Merge updated tasks
          if (data.updatedTasks && data.updatedTasks.length > 0) {
            const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
            for (const task of data.updatedTasks) {
              taskMap.set(task.id, task);
            }
            updates.tasks = Array.from(taskMap.values());
          }

          // Update categories
          if (data.categories) {
            updates.categories = data.categories.map((c: any) => ({
              id: c.id,
              label: c.label,
              color: c.color,
              icon: c.icon,
            }));
          }

          // Update today's completions
          if (data.todayDate && data.todayCompletions) {
            updates.dailyCompletions = {
              ...state.dailyCompletions,
              [data.todayDate]: data.todayCompletions,
            };
          }

          // Merge new completion logs
          if (data.newLogs && data.newLogs.length > 0) {
            const existingIds = new Set(state.completionLogs.map((l) => l.id));
            const newLogs = data.newLogs.filter((l: any) => !existingIds.has(l.id));
            if (newLogs.length > 0) {
              updates.completionLogs = [...state.completionLogs, ...newLogs];
            }
          }

          // Update season
          if (data.currentSeason) {
            updates.currentSeason = data.currentSeason as SeasonProfile;
          }

          return updates as any;
        });
      },
    }),
    {
      name: 'roxley-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAppStore;
