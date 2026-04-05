// API client for Housemate backend

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const AUTH_PIN = process.env.EXPO_PUBLIC_AUTH_PIN || "roxley2026";

interface RequestOptions {
  method?: string;
  body?: any;
  userRole?: "owner" | "sitter";
  userName?: string;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, userRole = "sitter", userName = "Sitter" } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Role": userRole,
    "X-User-Name": userName,
    "X-Auth-Pin": AUTH_PIN,
  };

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ---- Tasks ----

export function fetchTasks(role: string, name: string) {
  return apiRequest<any[]>("/api/tasks", { userRole: role as any, userName: name });
}

export function createTask(task: any, role: string, name: string) {
  return apiRequest<any>("/api/tasks", { method: "POST", body: task, userRole: role as any, userName: name });
}

export function updateTask(id: string, task: any, role: string, name: string) {
  return apiRequest<any>(`/api/tasks/${id}`, { method: "PUT", body: task, userRole: role as any, userName: name });
}

export function deleteTask(id: string, role: string, name: string) {
  return apiRequest<any>(`/api/tasks/${id}`, { method: "DELETE", userRole: role as any, userName: name });
}

// ---- Completions ----

export function fetchCompletions(date: string) {
  return apiRequest<any[]>(`/api/completions?date=${date}`);
}

export function completeTaskApi(data: {
  taskId: string;
  date: string;
  notes?: string;
  photoUrls?: string[];
  flaggedNeedsAttention?: boolean;
}, role: string, name: string) {
  return apiRequest<any>("/api/completions", { method: "POST", body: data, userRole: role as any, userName: name });
}

export function uncompleteTaskApi(taskId: string, date: string, role: string, name: string) {
  return apiRequest<any>(`/api/completions/${taskId}?date=${date}`, { method: "DELETE", userRole: role as any, userName: name });
}

export function fetchCompletionLogs(taskId?: string) {
  const query = taskId ? `?taskId=${taskId}` : "";
  return apiRequest<any[]>(`/api/completions/logs${query}`);
}

// ---- Categories ----

export function fetchCategories() {
  return apiRequest<any[]>("/api/categories");
}

export function createCategory(category: any, role: string, name: string) {
  return apiRequest<any>("/api/categories", { method: "POST", body: category, userRole: role as any, userName: name });
}

export function updateCategory(id: string, category: any, role: string, name: string) {
  return apiRequest<any>(`/api/categories/${id}`, { method: "PUT", body: category, userRole: role as any, userName: name });
}

export function deleteCategory(id: string, role: string, name: string) {
  return apiRequest<any>(`/api/categories/${id}`, { method: "DELETE", userRole: role as any, userName: name });
}

// ---- Sync ----

export interface SyncResponse {
  tasks: any[];
  categories: any[];
  dailyCompletions: Record<string, string[]>;
  completionLogs: any[];
  currentSeason: string;
  lastModified: string;
  serverTime: string;
}

export interface SyncSinceResponse {
  changed: boolean;
  updatedTasks?: any[];
  categories?: any[];
  todayCompletions?: string[];
  todayDate?: string;
  newLogs?: any[];
  currentSeason?: string;
  lastModified: string;
  serverTime?: string;
}

export function fetchSync() {
  return apiRequest<SyncResponse>("/api/sync");
}

export function fetchSyncSince(ts: string) {
  return apiRequest<SyncSinceResponse>(`/api/sync/since?ts=${encodeURIComponent(ts)}`);
}

export function updateConfig(config: { currentSeason?: string }, role: string, name: string) {
  return apiRequest<any>("/api/sync/config", { method: "PUT", body: config, userRole: role as any, userName: name });
}

// ---- AI ----

export function generateTaskWithAI(description: string, categories: { id: string; label: string }[], role: string, name: string) {
  return apiRequest<any>("/api/ai/generate-task", {
    method: "POST",
    body: { description, categories },
    userRole: role as any,
    userName: name,
  });
}
