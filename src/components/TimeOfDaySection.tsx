import React from 'react';
import { View, Text } from 'react-native';
import { TimeOfDay, getTimeOfDayLabel } from '@/lib/types';
import { Sunrise, Sun, Moon } from 'lucide-react-native';

interface TimeOfDaySectionProps {
  timeOfDay: TimeOfDay;
  children: React.ReactNode;
  taskCount: number;
  completedCount: number;
}

export default function TimeOfDaySection({
  timeOfDay,
  children,
  taskCount,
  completedCount,
}: TimeOfDaySectionProps) {
  const getIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Sunrise size={18} color="#F59E0B" />;
      case 'anytime':
        return <Sun size={18} color="#3B82F6" />;
      case 'evening':
        return <Moon size={18} color="#6366F1" />;
    }
  };

  const getBackgroundColor = () => {
    switch (timeOfDay) {
      case 'morning':
        return '#FEF3C7'; // amber-100
      case 'anytime':
        return '#DBEAFE'; // blue-100
      case 'evening':
        return '#E0E7FF'; // indigo-100
    }
  };

  if (taskCount === 0) return null;

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-3">
        <View
          style={{ backgroundColor: getBackgroundColor() }}
          className="w-8 h-8 rounded-full items-center justify-center mr-2"
        >
          {getIcon()}
        </View>
        <Text className="text-base font-semibold text-stone-700">
          {getTimeOfDayLabel(timeOfDay)}
        </Text>
        <View className="flex-row items-center ml-auto">
          <Text className="text-sm text-stone-400">
            {completedCount}/{taskCount}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}
