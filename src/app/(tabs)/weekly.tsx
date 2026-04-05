import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '@/lib/state/app-store';
import TaskCard from '@/components/TaskCard';
import { Task, getCategoryColor } from '@/lib/types';
import { CalendarDays, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function WeeklyScreen() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const completeTask = useAppStore((s) => s.completeTask);
  const uncompleteTask = useAppStore((s) => s.uncompleteTask);
  const isTaskCompletedThisWeek = useAppStore((s) => s.isTaskCompletedThisWeek);

  // Get weekly tasks
  const weeklyTasks = useMemo(() => {
    return tasks.filter((t) => t.isActive && t.frequency === 'weekly');
  }, [tasks]);

  // Group by category
  const tasksByCategory = useMemo(() => {
    const groups: Record<string, Task[]> = {};

    weeklyTasks.forEach((task) => {
      if (!groups[task.category]) {
        groups[task.category] = [];
      }
      groups[task.category].push(task);
    });

    // Sort by priority within each group
    const priorityOrder = { critical: 0, important: 1, routine: 2 };
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    });

    return groups;
  }, [weeklyTasks]);

  // Calculate completion stats
  const stats = useMemo(() => {
    const total = weeklyTasks.length;
    const completed = weeklyTasks.filter((t) => isTaskCompletedThisWeek(t.id)).length;
    const totalMinutes = weeklyTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const remainingMinutes = weeklyTasks
      .filter((t) => !isTaskCompletedThisWeek(t.id))
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);

    return {
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 100,
      totalMinutes,
      remainingMinutes,
    };
  }, [weeklyTasks, isTaskCompletedThisWeek]);

  const handleTaskPress = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const handleToggleComplete = (taskId: string) => {
    if (isTaskCompletedThisWeek(taskId)) {
      uncompleteTask(taskId);
    } else {
      completeTask(taskId);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      dog: 'Dog Care',
      chickens: 'Chickens',
      aquarium: 'Aquarium',
      garden: 'Garden',
      mowers: 'Robot Mowers',
      property: 'Property',
      seasonal: 'Seasonal',
    };
    return labels[category] || category;
  };

  return (
    <ScrollView className="flex-1 bg-amber-50/50">
      {/* Header Stats Card */}
      <LinearGradient
        colors={['#3F6212', '#65A30D', '#84CC16']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 20,
          padding: 20,
        }}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-white/80 text-sm font-medium">Weekly Progress</Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {stats.completed} of {stats.total}
              </Text>
            </View>
            <View className="bg-white/20 rounded-full p-3">
              <CalendarDays size={28} color="#fff" />
            </View>
          </View>

          {/* Progress bar */}
          <View className="bg-white/20 rounded-full h-3 overflow-hidden">
            <View
              className="bg-white h-full rounded-full"
              style={{ width: `${stats.progress}%` }}
            />
          </View>

          <View className="flex-row justify-between mt-4">
            <View>
              <Text className="text-white/70 text-xs">Time remaining</Text>
              <Text className="text-white text-lg font-semibold">
                ~{stats.remainingMinutes} min
              </Text>
            </View>
            <View>
              <Text className="text-white/70 text-xs">Resets Monday</Text>
              <Text className="text-white text-lg font-semibold">
                {stats.progress}% done
              </Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Tasks List */}
      <View className="px-4 pt-6 pb-8">
        <Text className="text-xl font-bold text-stone-800 mb-4">Weekly Tasks</Text>

        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
          <View key={category} className="mb-6">
            <View className="flex-row items-center mb-3">
              <View
                style={{ backgroundColor: getCategoryColor(category as Task['category']) }}
                className="w-3 h-3 rounded-full mr-2"
              />
              <Text className="text-base font-semibold text-stone-700">
                {getCategoryLabel(category)}
              </Text>
              <Text className="text-sm text-stone-400 ml-auto">
                {categoryTasks.filter((t) => isTaskCompletedThisWeek(t.id)).length}/
                {categoryTasks.length}
              </Text>
            </View>

            {categoryTasks.map((task, index) => (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <TaskCard
                  task={task}
                  isCompleted={isTaskCompletedThisWeek(task.id)}
                  onPress={() => handleTaskPress(task.id)}
                  onToggleComplete={() => handleToggleComplete(task.id)}
                />
              </Animated.View>
            ))}
          </View>
        ))}

        {weeklyTasks.length === 0 && (
          <View className="items-center py-12">
            <CheckCircle2 size={48} color="#65A30D" />
            <Text className="text-stone-500 text-base mt-4">No weekly tasks</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
