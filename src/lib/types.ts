// Roxley House Sitter Hub - Type Definitions

export type TaskFrequency = 'daily' | 'weekly' | 'seasonal' | 'as-needed' | 'custom';
export type TimeOfDay = 'morning' | 'anytime' | 'evening';
export type TaskPriority = 'critical' | 'important' | 'routine';
// Dynamic category - stored in app store, referenced by id
export interface Category {
  id: string;
  label: string;
  color: string;
  icon: string; // Lucide icon name
}

// Kids category — added for nanny/au pair mode (also injected via store migration for existing installs)
export const KIDS_CATEGORY: Category = { id: 'kids', label: 'Kids', color: '#EC4899', icon: 'Baby' };

// Default categories for new installs
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'dog', label: 'Dog Care', color: '#8B5CF6', icon: 'Dog' },
  { id: 'chickens', label: 'Chickens', color: '#F97316', icon: 'Bird' },
  { id: 'aquarium', label: 'Aquarium', color: '#0EA5E9', icon: 'Fish' },
  { id: 'garden', label: 'Garden', color: '#22C55E', icon: 'Flower2' },
  { id: 'mowers', label: 'Mowers', color: '#6366F1', icon: 'Bot' },
  { id: 'property', label: 'Property', color: '#78716C', icon: 'Home' },
  { id: 'seasonal', label: 'Seasonal', color: '#EAB308', icon: 'Sun' },
  KIDS_CATEGORY,
];

// TaskCategory is now just a string id reference
export type TaskCategory = string;
export type SeasonProfile = 'summer' | 'winter' | 'away';
export type UserRole = 'owner' | 'sitter' | 'nanny';

// Who a task is for: property care (sitter), kids (nanny/au pair), or both roles
export type TaskAudience = 'property' | 'kids' | 'both';

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'owner': return 'Property Owner';
    case 'sitter': return 'House Sitter';
    case 'nanny': return 'Au Pair / Nanny';
  }
}

// Owner sees everything; sitter sees property tasks; nanny sees kids tasks.
// Tasks without an audience are treated as property tasks (all pre-existing tasks).
export function isTaskVisibleToRole(task: Task, role: UserRole): boolean {
  if (role === 'owner') return true;
  const audience = task.audience ?? 'property';
  if (audience === 'both') return true;
  return role === 'nanny' ? audience === 'kids' : audience === 'property';
}

// How-To Guide - reusable instructional content that can be assigned to multiple tasks
export interface HowToGuide {
  id: string;
  title: string;
  description?: string;
  mediaUrls: string[]; // Photos and video URLs
  createdAt: string; // ISO date string
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  frequency: TaskFrequency;
  customIntervalDays?: number; // Used when frequency is 'custom'
  timeOfDay: TimeOfDay;
  estimatedMinutes?: number; // Optional — owner can set a duration for longer tasks
  // New structure: overview + steps array for better editing
  overview?: string; // Brief description of what this task is about
  steps?: string[]; // Array of steps - auto-numbered in UI
  description: string; // Legacy: full text description (used if steps not provided)
  mediaAttachments?: string[];
  priority: TaskPriority;
  requiresMedication: boolean;
  medicationText?: string;
  requiresPhoto: boolean;
  isActive: boolean;
  parentTaskId?: string | null;
  doneProperlyText?: string;
  redFlagsText?: string;
  seasonProfiles?: SeasonProfile[]; // Which seasons this task appears in
  howToGuideIds?: string[]; // References to HowToGuide items
  audience?: TaskAudience; // Who the task is for — undefined means 'property'
}

// ---- Household calendar events (bin night, rent due, appointments...) ----

export type EventRecurrence = 'once' | 'weekly' | 'fortnightly' | 'monthly' | 'yearly';

export interface HouseholdEvent {
  id: string;
  title: string;
  emoji?: string;
  recurrence: EventRecurrence;
  anchorDate: string; // YYYY-MM-DD — first (or only) occurrence
  notes?: string;
  color?: string;
}

export function getRecurrenceLabel(recurrence: EventRecurrence): string {
  switch (recurrence) {
    case 'once': return 'One-off';
    case 'weekly': return 'Weekly';
    case 'fortnightly': return 'Fortnightly';
    case 'monthly': return 'Monthly';
    case 'yearly': return 'Yearly';
  }
}

// ---- Shopping list ----

export interface ShoppingItem {
  id: string;
  name: string;
  addedBy: string;
  addedByRole: UserRole;
  addedAt: string; // ISO datetime
  purchased: boolean;
  purchasedAt?: string; // ISO datetime
}

// Helper to convert legacy description to steps
export function parseDescriptionToSteps(description: string): { overview: string; steps: string[] } {
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  const steps: string[] = [];
  let overview = '';
  let foundSteps = false;

  for (const line of lines) {
    // Check if this line starts a numbered step
    const stepMatch = line.match(/^(\d+)\.\s*(.+)$/);
    if (stepMatch) {
      foundSteps = true;
      steps.push(stepMatch[2]);
    } else if (line.toLowerCase().includes('**steps:**') || line.toLowerCase() === 'steps:') {
      foundSteps = true;
    } else if (!foundSteps) {
      overview += (overview ? ' ' : '') + line;
    }
  }

  return { overview, steps };
}

// Helper to convert steps array back to description string
export function stepsToDescription(overview: string, steps: string[]): string {
  if (steps.length === 0) return overview;

  const stepsText = steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
  return `${overview}\n\n**Steps:**\n${stepsText}`;
}

export interface CompletionLog {
  id: string;
  taskId: string;
  completedAt: string; // ISO date string
  completedBy: string;
  notes?: string;
  photoUrls?: string[];
  flaggedNeedsAttention: boolean;
}

export interface DailyTaskState {
  taskId: string;
  isCompleted: boolean;
  completedAt?: string;
}

// Helper to get priority color
export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'critical': return '#DC2626'; // red-600
    case 'important': return '#F59E0B'; // amber-500
    case 'routine': return '#6B7280'; // gray-500
  }
}

// Helper to get priority label
export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'critical': return 'Critical';
    case 'important': return 'Important';
    case 'routine': return 'Routine';
  }
}

// Helper to get category icon name (lucide) - uses DEFAULT_CATEGORIES as fallback
export function getCategoryIcon(category: TaskCategory, categories?: Category[]): string {
  const allCategories = categories ?? DEFAULT_CATEGORIES;
  const found = allCategories.find(c => c.id === category);
  return found?.icon ?? 'Folder';
}

// Helper to get time of day label
export function getTimeOfDayLabel(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'morning': return 'Morning';
    case 'anytime': return 'Anytime';
    case 'evening': return 'Evening';
  }
}

// Helper to get frequency label
export function getFrequencyLabel(frequency: TaskFrequency, customIntervalDays?: number): string {
  switch (frequency) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'custom': return `Every ${customIntervalDays ?? 3} days`;
    case 'seasonal': return 'Seasonal';
    case 'as-needed': return 'As Needed';
  }
}

// Helper to get category color - uses DEFAULT_CATEGORIES as fallback
export function getCategoryColor(category: TaskCategory, categories?: Category[]): string {
  const allCategories = categories ?? DEFAULT_CATEGORIES;
  const found = allCategories.find(c => c.id === category);
  return found?.color ?? '#78716C'; // stone-500 as fallback
}

// Helper to get category label - uses DEFAULT_CATEGORIES as fallback
export function getCategoryLabel(category: TaskCategory, categories?: Category[]): string {
  const allCategories = categories ?? DEFAULT_CATEGORIES;
  const found = allCategories.find(c => c.id === category);
  return found?.label ?? category;
}
