import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '@/lib/state/app-store';
import TaskCard from '@/components/TaskCard';
import TimeOfDaySection from '@/components/TimeOfDaySection';
import { ProgressBar } from '@/components/ProgressRing';
import { Task, TimeOfDay } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TodayScreen() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const dailyCompletions = useAppStore((s) => s.dailyCompletions);
  const completeTask = useAppStore((s) => s.completeTask);
  const uncompleteTask = useAppStore((s) => s.uncompleteTask);
  const isTaskCompletedToday = useAppStore((s) => s.isTaskCompletedToday);
  const getTodaysTasks = useAppStore((s) => s.getTodaysTasks);

  // Get today's tasks (daily + custom tasks due today)
  const todaysTasks = useMemo(() => {
    return getTodaysTasks();
  }, [tasks, dailyCompletions, getTodaysTasks]);

  // Group by time of day
  const tasksByTime = useMemo(() => {
    const groups: Record<TimeOfDay, Task[]> = {
      morning: [],
      anytime: [],
      evening: [],
    };

    todaysTasks.forEach((task) => {
      groups[task.timeOfDay].push(task);
    });

    // Sort by priority within each group
    const priorityOrder = { critical: 0, important: 1, routine: 2 };
    Object.keys(groups).forEach((key) => {
      groups[key as TimeOfDay].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    });

    return groups;
  }, [todaysTasks]);

  // Calculate completion stats
  const stats = useMemo(() => {
    const total = todaysTasks.length;
    const completed = todaysTasks.filter((t) => isTaskCompletedToday(t.id)).length;
    const criticalMissed = todaysTasks.filter(
      (t) => t.priority === 'critical' && !isTaskCompletedToday(t.id)
    ).length;
    const totalMinutes = todaysTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const remainingMinutes = todaysTasks
      .filter((t) => !isTaskCompletedToday(t.id))
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);

    return {
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 100,
      criticalMissed,
      totalMinutes,
      remainingMinutes,
    };
  }, [todaysTasks, isTaskCompletedToday, dailyCompletions]);

  const handleTaskPress = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const handleToggleComplete = (taskId: string) => {
    if (isTaskCompletedToday(taskId)) {
      uncompleteTask(taskId);
    } else {
      completeTask(taskId);
    }
  };

  const getCompletedCount = (time: TimeOfDay) => {
    return tasksByTime[time].filter((t) => isTaskCompletedToday(t.id)).length;
  };

  return (
    <ScrollView className="flex-1 bg-amber-50/50">
      {/* Header Stats Card */}
      <LinearGradient
        colors={['#9A3412', '#C2410C', '#EA580C']}
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
              <Text className="text-white/80 text-sm font-medium">Today's Progress</Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {stats.completed} of {stats.total}
              </Text>
            </View>
            {stats.progress === 100 ? (
              <View className="bg-white/20 rounded-full p-3">
                <CheckCircle2 size={28} color="#fff" />
              </View>
            ) : stats.criticalMissed > 0 ? (
              <View className="bg-red-500/30 rounded-full p-3">
                <AlertTriangle size={28} color="#fff" />
              </View>
            ) : (
              <View className="bg-white/20 rounded-full p-3">
                <Clock size={28} color="#fff" />
              </View>
            )}
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
            {stats.criticalMissed > 0 && (
              <View className="bg-red-500/30 px-3 py-1 rounded-full flex-row items-center">
                <AlertTriangle size={14} color="#fff" />
                <Text className="text-white text-sm font-medium ml-1">
                  {stats.criticalMissed} critical
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Tasks List */}
      <View className="px-4 pt-6 pb-8">
        <Text className="text-xl font-bold text-stone-800 mb-4">Today's Tasks</Text>

        {(['morning', 'anytime', 'evening'] as TimeOfDay[]).map((time) => (
          <TimeOfDaySection
            key={time}
            timeOfDay={time}
            taskCount={tasksByTime[time].length}
            completedCount={getCompletedCount(time)}
          >
            {tasksByTime[time].map((task, index) => (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <TaskCard
                  task={task}
                  isCompleted={isTaskCompletedToday(task.id)}
                  onPress={() => handleTaskPress(task.id)}
                  onToggleComplete={() => handleToggleComplete(task.id)}
                />
              </Animated.View>
            ))}
          </TimeOfDaySection>
        ))}

        {todaysTasks.length === 0 && (
          <View className="items-center py-12">
            <CheckCircle2 size={48} color="#65A30D" />
            <Text className="text-stone-500 text-base mt-4">No tasks for today</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
