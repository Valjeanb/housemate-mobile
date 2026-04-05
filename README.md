# Housemate

A mobile-first task management app for house sitters staying rent-free who are expected to contribute ~1 hour per day to property care.

## Features

### For House Sitters
- **Today's Tasks**: View daily tasks grouped by morning/anytime/evening
- **Weekly Tasks**: View tasks that reset each Monday
- **Task Details**: Expand tasks to see full instructions, what "done" looks like, and red flags
- **Task Completion**: Check off tasks with optional notes and "Needs Attention" flag
- **Progress Tracking**: See daily completion percentage and estimated time remaining

### For Property Owners
- **Dashboard**: View completion summary, missed critical tasks, and flagged issues
- **Task Manager**: Create, edit, enable/disable tasks
- **Category Manager**: Add, edit, or remove task categories with custom colors and icons
- **How-To Library**: Create reusable how-to guides with photos and videos that can be assigned to multiple tasks
- **Step-by-Step Editor**: Add tasks with auto-numbered steps (no manual 1., 2., 3. needed)
- **Reorder Steps**: Use up/down arrows to reorder steps within a task
- **Media Attachments**: Upload photos and videos to explain workflows visually
- **Schedule vs Instructions**: Time of day is separate from instructions - change schedule without rewriting steps
- **Season Profiles**: Switch between Summer/Winter/Away to toggle seasonal tasks
- **Activity Feed**: See recent completions with notes and photos
- **Edit from Task Detail**: Tap the pencil icon on any task to edit (owner mode only)

## App Structure

```
src/
├── app/
│   ├── (tabs)/           # Tab-based navigation
│   │   ├── index.tsx     # Today's tasks screen (House Sitter)
│   │   ├── weekly.tsx    # Weekly tasks screen
│   │   ├── owner.tsx     # Owner dashboard (visible in owner mode)
│   │   └── settings.tsx  # Settings & role switching
│   ├── task/[id].tsx     # Task detail screen
│   ├── task-manager.tsx  # Owner task management
│   ├── category-manager.tsx # Owner category management
│   ├── howto-library.tsx # How-To Library management
│   └── edit-task/[id].tsx # Create/edit task modal
├── components/
│   ├── TaskCard.tsx      # Task card with checkbox
│   ├── TimeOfDaySection.tsx # Morning/Anytime/Evening sections
│   └── ProgressRing.tsx  # Progress display components
└── lib/
    ├── types.ts          # TypeScript types & Category definitions
    ├── seed-tasks.ts     # Pre-loaded task data
    └── state/
        └── app-store.ts  # Zustand store for state & category management
```

## Task Categories

Categories are fully customizable by the owner. Default categories include:
- Dog Care
- Chickens
- Aquarium
- Garden
- Mowers
- Property
- Seasonal

Owners can add new categories, change names, colors, and icons via the Category Manager.

## Priority Levels
- **Critical**: Must be done (e.g., feeding Scout)
- **Important**: Should be done (e.g., chicken care)
- **Routine**: Regular maintenance (e.g., mower check)

## Reset Rules
- Daily tasks reset each day
- Weekly tasks reset Monday
- Custom interval tasks (e.g., "Every 3 days") appear on the Today screen when due based on last completion
- Seasonal tasks appear only when enabled by owner

## User Roles
- **House Sitter**: View and complete tasks, add notes
- **Owner**: Full access plus task management and dashboard

Toggle between roles in Settings.
