import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '@/lib/state/app-store';
import { getPriorityColor, getCategoryColor } from '@/lib/types';
import { generateTaskWithAI } from '@/lib/api';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Camera,
  MessageSquare,
  Edit3,
  Folder,
  BookOpen,
  Sparkles,
  Wand2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const categories = useAppStore((s) => s.categories);
  const completionLogs = useAppStore((s) => s.completionLogs);
  const isTaskCompletedToday = useAppStore((s) => s.isTaskCompletedToday);
  const isTaskCompletedThisWeek = useAppStore((s) => s.isTaskCompletedThisWeek);
  const userRole = useAppStore((s) => s.userRole);
  const userName = useAppStore((s) => s.userName);
  const setAiGeneratedTask = useAppStore((s) => s.setAiGeneratedTask);

  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateTaskWithAI(
        aiPrompt.trim(),
        categories.map((c) => ({ id: c.id, label: c.label })),
        userRole,
        userName
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAiGeneratedTask(result);
      setAiPrompt('');
      router.push('/edit-task/new');
    } catch (err: any) {
      setAiError(err.message || 'AI generation failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAiLoading(false);
    }
  };

  // Get daily tasks for stats
  const dailyTasks = useMemo(() => {
    return tasks.filter((t) => t.isActive && t.frequency === 'daily');
  }, [tasks]);

  const weeklyTasks = useMemo(() => {
    return tasks.filter((t) => t.isActive && t.frequency === 'weekly');
  }, [tasks]);

  // Calculate stats
  const dailyStats = useMemo(() => {
    const total = dailyTasks.length;
    const completed = dailyTasks.filter((t) => isTaskCompletedToday(t.id)).length;
    return { total, completed, progress: total > 0 ? Math.round((completed / total) * 100) : 100 };
  }, [dailyTasks, isTaskCompletedToday]);

  const weeklyStats = useMemo(() => {
    const total = weeklyTasks.length;
    const completed = weeklyTasks.filter((t) => isTaskCompletedThisWeek(t.id)).length;
    return { total, completed, progress: total > 0 ? Math.round((completed / total) * 100) : 100 };
  }, [weeklyTasks, isTaskCompletedThisWeek]);

  // Missed critical tasks
  const missedCritical = useMemo(() => {
    return dailyTasks.filter(
      (t) => t.priority === 'critical' && !isTaskCompletedToday(t.id)
    );
  }, [dailyTasks, isTaskCompletedToday]);

  // Needs attention logs (recent ones)
  const needsAttentionLogs = useMemo(() => {
    return completionLogs
      .filter((log) => log.flaggedNeedsAttention)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 5);
  }, [completionLogs]);

  // Recent completions with notes or photos
  const recentNotableLogs = useMemo(() => {
    return completionLogs
      .filter((log) => log.notes || (log.photoUrls && log.photoUrls.length > 0))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 5);
  }, [completionLogs]);

  const getTaskById = (taskId: string) => tasks.find((t) => t.id === taskId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <ScrollView className="flex-1 bg-amber-50/50">
      <View className="px-4 py-6">
        {/* AI Quick Add */}
        <Animated.View entering={FadeInDown.duration(300)} className="mb-6">
          <View className="bg-gradient-to-r rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#7C3AED', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center mb-3">
                <Sparkles size={18} color="#fff" />
                <Text className="text-white font-semibold text-sm ml-2">AI Quick Add</Text>
              </View>
              <TextInput
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder="Describe a task... e.g. 'Feed Scout his dinner with arthritis pill'"
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                numberOfLines={2}
                className="bg-white/15 rounded-xl p-3 text-white text-sm mb-3"
                style={{ textAlignVertical: 'top', minHeight: 50 }}
                editable={!aiLoading}
              />
              {aiError && (
                <Text className="text-red-200 text-xs mb-2">{aiError}</Text>
              )}
              <Pressable
                onPress={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className={`flex-row items-center justify-center py-3 rounded-xl ${
                  aiLoading || !aiPrompt.trim() ? 'bg-white/20' : 'bg-white/30 active:bg-white/40'
                }`}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Wand2 size={18} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Generate Task</Text>
                  </>
                )}
              </Pressable>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <View className="flex-row mb-6">
          <Animated.View entering={FadeInDown.duration(300)} className="flex-1 mr-2">
            <LinearGradient
              colors={['#9A3412', '#C2410C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <Text className="text-white/80 text-xs font-medium">Today</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {dailyStats.completed}/{dailyStats.total}
              </Text>
              <View className="bg-white/20 rounded-full h-2 mt-2 overflow-hidden">
                <View
                  className="bg-white h-full rounded-full"
                  style={{ width: `${dailyStats.progress}%` }}
                />
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).duration(300)} className="flex-1 ml-2">
            <LinearGradient
              colors={['#3F6212', '#65A30D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <Text className="text-white/80 text-xs font-medium">This Week</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {weeklyStats.completed}/{weeklyStats.total}
              </Text>
              <View className="bg-white/20 rounded-full h-2 mt-2 overflow-hidden">
                <View
                  className="bg-white h-full rounded-full"
                  style={{ width: `${weeklyStats.progress}%` }}
                />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Missed Critical Tasks */}
        {missedCritical.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-6">
            <View className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <View className="flex-row items-center mb-3">
                <AlertTriangle size={20} color="#DC2626" />
                <Text className="text-base font-bold text-red-800 ml-2">
                  Missed Critical Tasks
                </Text>
              </View>
              {missedCritical.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push(`/task/${task.id}`)}
                  className="flex-row items-center py-2 border-t border-red-100"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-red-900">{task.title}</Text>
                    <Text className="text-xs text-red-600 capitalize">{task.category}</Text>
                  </View>
                  <ChevronRight size={16} color="#DC2626" />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Needs Attention Feed */}
        {needsAttentionLogs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(300)} className="mb-6">
            <Text className="text-lg font-bold text-stone-800 mb-3">Needs Attention</Text>
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
              {needsAttentionLogs.map((log, index) => {
                const task = getTaskById(log.taskId);
                return (
                  <Pressable
                    key={log.id}
                    onPress={() => router.push(`/task/${log.taskId}`)}
                    className={`p-4 ${
                      index < needsAttentionLogs.length - 1 ? 'border-b border-stone-100' : ''
                    }`}
                  >
                    <View className="flex-row items-start">
                      <View className="bg-amber-100 rounded-full p-2 mr-3">
                        <AlertTriangle size={16} color="#F59E0B" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-stone-800">
                          {task?.title ?? 'Unknown Task'}
                        </Text>
                        {log.notes && (
                          <Text className="text-xs text-stone-500 mt-1">{log.notes}</Text>
                        )}
                        <Text className="text-xs text-stone-400 mt-1">
                          {formatDate(log.completedAt)} • {log.completedBy}
                        </Text>
                      </View>
                      {log.photoUrls && log.photoUrls.length > 0 && (
                        <Camera size={16} color="#9CA3AF" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Task Manager Link */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Pressable
            onPress={() => router.push('/task-manager')}
            className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-stone-100 mb-3"
          >
            <View className="bg-orange-100 rounded-full p-3 mr-4">
              <Edit3 size={20} color="#C2410C" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-stone-800">Task Manager</Text>
              <Text className="text-sm text-stone-500">
                Create, edit, and manage all tasks
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>
        </Animated.View>

        {/* Category Manager Link */}
        <Animated.View entering={FadeInDown.delay(225).duration(300)}>
          <Pressable
            onPress={() => router.push('/category-manager')}
            className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-stone-100 mb-3"
          >
            <View className="bg-lime-100 rounded-full p-3 mr-4">
              <Folder size={20} color="#65A30D" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-stone-800">Manage Categories</Text>
              <Text className="text-sm text-stone-500">
                Add, edit, or remove task categories
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>
        </Animated.View>

        {/* How-To Library Link */}
        <Animated.View entering={FadeInDown.delay(250).duration(300)}>
          <Pressable
            onPress={() => router.push('/howto-library')}
            className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-stone-100 mb-6"
          >
            <View className="bg-amber-100 rounded-full p-3 mr-4">
              <BookOpen size={20} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-stone-800">How-To Library</Text>
              <Text className="text-sm text-stone-500">
                Create reusable guides with photos & videos
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>
        </Animated.View>

        {/* Recent Activity */}
        {recentNotableLogs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(300)}>
            <Text className="text-lg font-bold text-stone-800 mb-3">Recent Activity</Text>
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
              {recentNotableLogs.map((log, index) => {
                const task = getTaskById(log.taskId);
                return (
                  <View
                    key={log.id}
                    className={`p-4 ${
                      index < recentNotableLogs.length - 1 ? 'border-b border-stone-100' : ''
                    }`}
                  >
                    <View className="flex-row items-start">
                      <View className="bg-lime-100 rounded-full p-2 mr-3">
                        <CheckCircle2 size={16} color="#65A30D" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-stone-800">
                          {task?.title ?? 'Unknown Task'}
                        </Text>
                        {log.notes && (
                          <View className="flex-row items-start mt-1">
                            <MessageSquare size={12} color="#9CA3AF" />
                            <Text className="text-xs text-stone-500 ml-1 flex-1">
                              {log.notes}
                            </Text>
                          </View>
                        )}
                        <Text className="text-xs text-stone-400 mt-1">
                          {formatDate(log.completedAt)} • {log.completedBy}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Empty State */}
        {dailyStats.total === 0 && weeklyStats.total === 0 && (
          <View className="items-center py-12">
            <CheckCircle2 size={48} color="#65A30D" />
            <Text className="text-stone-500 text-base mt-4">No tasks configured yet</Text>
            <Pressable
              onPress={() => router.push('/task-manager')}
              className="mt-4 bg-orange-600 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Set Up Tasks</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
