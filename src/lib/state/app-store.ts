// Roxley House Sitter Hub - Main Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Task,
  CompletionLog,
  SeasonProfile,
  UserRole,
  Category,
  DEFAULT_CATEGORIES,
  KIDS_CATEGORY,
  HowToGuide,
  HouseholdEvent,
  ShoppingItem,
  isTaskVisibleToRole,
} from '../types';
import { getTodayString, getWeekStartString, addDaysToDateString, parseDateString } from '../dates';
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

  // Household calendar events
  events: HouseholdEvent[];
  addEvent: (event: HouseholdEvent) => void;
  updateEvent: (eventId: string, updates: Partial<HouseholdEvent>) => void;
  deleteEvent: (eventId: string) => void;

  // Shopping list
  shoppingItems: ShoppingItem[];
  addShoppingItem: (name: string) => void;
  removeShoppingItem: (itemId: string) => void;
  setItemPurchased: (itemId: string, purchased: boolean) => void; // owner only (enforced in UI)
  markAllPurchased: () => void; // owner only (enforced in UI)
  clearPurchasedItems: () => void;

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

// Date helpers now live in ../dates and use the device's LOCAL timezone —
// the old toISOString() versions were UTC and rolled the day over at 10-11am AEST.

// Helper to check if date is in current week (YYYY-MM-DD strings compare lexicographically)
const isInCurrentWeek = (dateString: string) => {
  const weekStart = getWeekStartString();
  const weekEnd = addDaysToDateString(weekStart, 7);
  return dateString >= weekStart && dateString < weekEnd;
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

  const lastDate = parseDateString(lastCompletion);
  const today = parseDateString(getTodayString());

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
      events: [],
      shoppingItems: [],
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
        const { userName, userRole, tasks, dailyCompletions } = get();
        const task = tasks.find((t) => t.id === taskId);

        // Weekly tasks can have been completed on an earlier day this week —
        // un-completing must clear every day in the current week, not just today.
        const affectedDates =
          task?.frequency === 'weekly'
            ? Object.keys(dailyCompletions).filter(
                (date) => isInCurrentWeek(date) && dailyCompletions[date].includes(taskId)
              )
            : [today];

        // Optimistic local update
        set((state) => {
          const updated = { ...state.dailyCompletions };
          for (const date of affectedDates) {
            updated[date] = (updated[date] || []).filter((id) => id !== taskId);
          }
          return { dailyCompletions: updated };
        });

        // Fire API calls
        for (const date of affectedDates) {
          api.uncompleteTaskApi(taskId, date, userRole, userName).catch((err) => {
            console.warn('Failed to sync uncomplete to server:', err.message);
          });
        }
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

      // Getters — all filtered by role visibility (sitter: property tasks, nanny: kids tasks, owner: all)
      getActiveTasks: () => {
        const { tasks, userRole } = get();
        return tasks.filter((t) => t.isActive && isTaskVisibleToRole(t, userRole));
      },

      getDailyTasks: () => {
        return get().getActiveTasks().filter((t) => t.frequency === 'daily');
      },

      getWeeklyTasks: () => {
        return get().getActiveTasks().filter((t) => t.frequency === 'weekly');
      },

      getTodaysTasks: () => {
        const state = get();
        return state.getActiveTasks().filter((t) => {
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

      // Household calendar events
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      updateEvent: (eventId, updates) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
        })),
      deleteEvent: (eventId) =>
        set((state) => ({ events: state.events.filter((e) => e.id !== eventId) })),

      // Shopping list
      addShoppingItem: (name) => {
        const { userName, userRole } = get();
        const item: ShoppingItem = {
          id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: name.trim(),
          addedBy: userName,
          addedByRole: userRole,
          addedAt: new Date().toISOString(),
          purchased: false,
        };
        set((state) => ({ shoppingItems: [...state.shoppingItems, item] }));
      },
      removeShoppingItem: (itemId) =>
        set((state) => ({
          shoppingItems: state.shoppingItems.filter((i) => i.id !== itemId),
        })),
      setItemPurchased: (itemId, purchased) =>
        set((state) => ({
          shoppingItems: state.shoppingItems.map((i) =>
            i.id === itemId
              ? { ...i, purchased, purchasedAt: purchased ? new Date().toISOString() : undefined }
              : i
          ),
        })),
      markAllPurchased: () =>
        set((state) => ({
          shoppingItems: state.shoppingItems.map((i) =>
            i.purchased ? i : { ...i, purchased: true, purchasedAt: new Date().toISOString() }
          ),
        })),
      clearPurchasedItems: () =>
        set((state) => ({
          shoppingItems: state.shoppingItems.filter((i) => !i.purchased),
        })),

      initializeWithSeedData: () => {
        const currentTasks = get().tasks;
        if (currentTasks.length === 0) {
          set({ tasks: seedTasks });
        }
        // Safety net: the Kids category must always exist for nanny mode
        // (older server syncs could wipe it before sync was made non-destructive)
        if (!get().categories.some((c) => c.id === KIDS_CATEGORY.id)) {
          set((state) => ({ categories: [...state.categories, KIDS_CATEGORY] }));
        }
      },

      resetToDefaultTasks: () => {
        set({ tasks: seedTasks, dailyCompletions: {}, completionLogs: [] });
      },

      // Server sync — LOCAL-FIRST. The write path for task/category edits was never
      // built (owner edits don't reach the server), so applying server tasks/categories/
      // season here would overwrite local work with stale data every launch and every
      // 15s poll. Until proper two-way sync exists, this device's data is the truth:
      // only completions are merged in (additively), never tasks or categories.
      syncFromServer: (data) => {
        set((state) => {
          const merged = { ...state.dailyCompletions };
          for (const [date, ids] of Object.entries(data.dailyCompletions ?? {})) {
            merged[date] = Array.from(new Set([...(merged[date] ?? []), ...ids]));
          }
          const existingLogIds = new Set(state.completionLogs.map((l) => l.id));
          const newLogs = (data.completionLogs ?? []).filter((l: any) => !existingLogIds.has(l.id));
          return {
            dailyCompletions: merged,
            completionLogs: newLogs.length > 0 ? [...state.completionLogs, ...newLogs] : state.completionLogs,
            isOnline: true,
            lastSyncAt: data.lastModified,
          };
        });
      },

      // Merge incremental sync update — completions only, additive (see note above)
      mergeSyncUpdate: (data) => {
        if (!data.changed) {
          set({ isOnline: true, lastSyncAt: data.lastModified });
          return;
        }

        set((state) => {
          const updates: Partial<AppStore> = {
            isOnline: true,
            lastSyncAt: data.lastModified,
          };

          // Union today's completions (never remove local optimistic ticks)
          if (data.todayDate && data.todayCompletions) {
            const local = state.dailyCompletions[data.todayDate] ?? [];
            updates.dailyCompletions = {
              ...state.dailyCompletions,
              [data.todayDate]: Array.from(new Set([...local, ...data.todayCompletions])),
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

          return updates as any;
        });
      },
    }),
    {
      name: 'roxley-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 1 && persisted) {
          // v1: nanny mode added a Kids category; inject it for existing installs
          if (Array.isArray(persisted.categories) && !persisted.categories.some((c: any) => c.id === KIDS_CATEGORY.id)) {
            persisted.categories = [...persisted.categories, KIDS_CATEGORY];
          }
          if (!Array.isArray(persisted.events)) persisted.events = [];
          if (!Array.isArray(persisted.shoppingItems)) persisted.shoppingItems = [];
        }
        if (version < 2 && persisted) {
          // v2: task durations became opt-in — strip the old template-era estimates
          if (Array.isArray(persisted.tasks)) {
            persisted.tasks = persisted.tasks.map((t: any) => {
              const { estimatedMinutes, ...rest } = t;
              return rest;
            });
          }
        }
        return persisted;
      },
    }
  )
);

export default useAppStore;
