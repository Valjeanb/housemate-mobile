import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Task, getPriorityColor, getPriorityLabel, getCategoryColor, getCategoryLabel } from '@/lib/types';
import { cn } from '@/lib/cn';
import { Check, Clock, AlertTriangle, Pill } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  onPress: () => void;
  onToggleComplete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TaskCard({ task, isCompleted, onPress, onToggleComplete }: TaskCardProps) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleToggle = async () => {
    checkScale.value = withSpring(1.2, {}, () => {
      checkScale.value = withSpring(1);
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleComplete();
  };

  const priorityColor = getPriorityColor(task.priority);
  const categoryColor = getCategoryColor(task.category);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className={cn(
        'bg-white rounded-2xl p-4 mb-3 shadow-sm border border-stone-100',
        isCompleted && 'opacity-60'
      )}
    >
      <View className="flex-row items-start">
        {/* Checkbox */}
        <Pressable
          onPress={handleToggle}
          className="mr-3 mt-0.5"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View
            style={[
              checkAnimatedStyle,
              {
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: isCompleted ? '#65A30D' : '#D1D5DB',
                backgroundColor: isCompleted ? '#65A30D' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            {isCompleted && <Check size={16} color="#fff" strokeWidth={3} />}
          </Animated.View>
        </Pressable>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            {/* Priority badge */}
            <View
              style={{ backgroundColor: `${priorityColor}15` }}
              className="px-2 py-0.5 rounded-full mr-2"
            >
              <Text style={{ color: priorityColor }} className="text-xs font-semibold">
                {getPriorityLabel(task.priority)}
              </Text>
            </View>

            {/* Time estimate */}
            <View className="flex-row items-center">
              <Clock size={12} color="#9CA3AF" />
              <Text className="text-xs text-stone-400 ml-1">{task.estimatedMinutes} min</Text>
            </View>
          </View>

          {/* Title */}
          <Text
            className={cn(
              'text-base font-semibold text-stone-800 mb-1',
              isCompleted && 'line-through text-stone-400'
            )}
          >
            {task.title}
          </Text>

          {/* Category indicator */}
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: categoryColor }}
              className="w-2 h-2 rounded-full mr-2"
            />
            <Text className="text-xs text-stone-500">{getCategoryLabel(task.category)}</Text>

            {/* Medication indicator */}
            {task.requiresMedication && (
              <View className="flex-row items-center ml-3">
                <Pill size={12} color="#DC2626" />
                <Text className="text-xs text-red-600 ml-1">Medication</Text>
              </View>
            )}
          </View>
        </View>

        {/* Alert indicator for critical */}
        {task.priority === 'critical' && !isCompleted && (
          <View className="ml-2">
            <AlertTriangle size={20} color="#DC2626" />
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}
