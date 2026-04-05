import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import useAppStore from '@/lib/state/app-store';
import {
  Task,
  TaskCategory,
  getPriorityColor,
  getPriorityLabel,
  getCategoryColor,
  getCategoryLabel,
  getFrequencyLabel,
} from '@/lib/types';
import {
  Plus,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function TaskManagerScreen() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const categories = useAppStore((s) => s.categories);
  const toggleTaskActive = useAppStore((s) => s.toggleTaskActive);

  const [showInactive, setShowInactive] = useState(false);
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');

  // Filter options including "All"
  const filterOptions = useMemo(() => {
    return [{ id: 'all', label: 'All' }, ...categories.map(c => ({ id: c.id, label: c.label }))];
  }, [categories]);

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const filtered = tasks.filter((t) => {
      if (!showInactive && !t.isActive) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });

    const groups: Record<string, Task[]> = {};
    filtered.forEach((task) => {
      if (!groups[task.category]) {
        groups[task.category] = [];
      }
      groups[task.category].push(task);
    });

    // Sort by priority within each group
    const priorityOrder: Record<string, number> = { critical: 0, important: 1, routine: 2 };
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));
    });

    return groups;
  }, [tasks, showInactive, filterCategory]);

  const handleToggleActive = async (taskId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTaskActive(taskId);
  };

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => t.isActive).length;

  return (
    <ScrollView className="flex-1 bg-amber-50/50">
      <View className="px-4 py-6">
        {/* Stats */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="flex-row mb-6"
        >
          <View className="flex-1 bg-white rounded-2xl p-4 mr-2 shadow-sm border border-stone-100">
            <Text className="text-2xl font-bold text-stone-800">{activeTasks}</Text>
            <Text className="text-xs text-stone-500">Active Tasks</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 ml-2 shadow-sm border border-stone-100">
            <Text className="text-2xl font-bold text-stone-800">{totalTasks}</Text>
            <Text className="text-xs text-stone-500">Total Tasks</Text>
          </View>
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} className="mb-4">
          {/* Show Inactive Toggle */}
          <View className="flex-row items-center justify-between bg-white rounded-2xl p-4 mb-3 shadow-sm border border-stone-100">
            <View className="flex-row items-center">
              <Filter size={18} color="#78716C" />
              <Text className="text-base text-stone-700 ml-2">Show Inactive Tasks</Text>
            </View>
            <Switch
              value={showInactive}
              onValueChange={setShowInactive}
              trackColor={{ false: '#D1D5DB', true: '#FDBA74' }}
              thumbColor={showInactive ? '#C2410C' : '#fff'}
            />
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            {filterOptions.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilterCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-full mr-2 ${
                  filterCategory === cat.id
                    ? 'bg-orange-600'
                    : 'bg-white border border-stone-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filterCategory === cat.id ? 'text-white' : 'text-stone-600'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Add New Task Button */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Pressable
            onPress={() => router.push('/edit-task/new')}
            className="bg-orange-600 rounded-2xl p-4 flex-row items-center justify-center mb-6 active:bg-orange-700"
          >
            <Plus size={20} color="#fff" />
            <Text className="text-white font-bold text-base ml-2">Add New Task</Text>
          </Pressable>
        </Animated.View>

        {/* Task List */}
        {Object.entries(tasksByCategory).map(([category, categoryTasks], catIndex) => (
          <Animated.View
            key={category}
            entering={FadeInDown.delay(150 + catIndex * 50).duration(300)}
            className="mb-6"
          >
            <View className="flex-row items-center mb-3">
              <View
                style={{ backgroundColor: getCategoryColor(category, categories) }}
                className="w-3 h-3 rounded-full mr-2"
              />
              <Text className="text-base font-semibold text-stone-700">
                {getCategoryLabel(category, categories)}
              </Text>
              <Text className="text-sm text-stone-400 ml-auto">
                {categoryTasks.length} tasks
              </Text>
            </View>

            <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
              {categoryTasks.map((task, index) => (
                <View
                  key={task.id}
                  className={`${
                    index < categoryTasks.length - 1 ? 'border-b border-stone-100' : ''
                  }`}
                >
                  <Pressable
                    onPress={() => router.push(`/edit-task/${task.id}`)}
                    className="flex-row items-center p-4"
                  >
                    {/* Active Toggle */}
                    <Pressable
                      onPress={() => handleToggleActive(task.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="mr-3"
                    >
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          task.isActive ? 'bg-lime-100' : 'bg-stone-100'
                        }`}
                      >
                        {task.isActive ? (
                          <Eye size={16} color="#65A30D" />
                        ) : (
                          <EyeOff size={16} color="#9CA3AF" />
                        )}
                      </View>
                    </Pressable>

                    {/* Task Info */}
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text
                          className={`text-base font-medium ${
                            task.isActive ? 'text-stone-800' : 'text-stone-400'
                          }`}
                        >
                          {task.title}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <View
                          style={{ backgroundColor: `${getPriorityColor(task.priority)}20` }}
                          className="px-2 py-0.5 rounded mr-2"
                        >
                          <Text
                            style={{ color: getPriorityColor(task.priority) }}
                            className="text-xs font-medium"
                          >
                            {getPriorityLabel(task.priority)}
                          </Text>
                        </View>
                        <Clock size={12} color="#9CA3AF" />
                        <Text className="text-xs text-stone-400 ml-1">
                          {task.estimatedMinutes} min
                        </Text>
                        <Text className="text-xs text-stone-400 ml-2">
                          • {getFrequencyLabel(task.frequency, task.customIntervalDays)}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        {Object.keys(tasksByCategory).length === 0 && (
          <View className="items-center py-12">
            <Text className="text-stone-400 text-base">No tasks found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
