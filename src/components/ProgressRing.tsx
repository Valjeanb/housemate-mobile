import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
}

export default function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = '#22C55E',
  backgroundColor = '#E5E7EB',
  label,
}: ProgressRingProps) {
  const innerSize = size - strokeWidth * 2;

  // Simple progress bar style approach for React Native
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${progress}%` as unknown as number, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      }),
    };
  });

  return (
    <View className="items-center">
      {/* Circular display with percentage */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
        className="items-center justify-center"
      >
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: progress < 50 ? 'transparent' : color,
            borderLeftColor: progress < 75 ? 'transparent' : color,
            transform: [{ rotate: '-45deg' }],
          }}
        />
        <Text className="text-xl font-bold text-stone-800">{progress}%</Text>
      </View>
      {label && <Text className="text-xs text-stone-500 mt-1">{label}</Text>}
    </View>
  );
}

// Simpler linear progress bar component
export function ProgressBar({
  progress,
  height = 8,
  color = '#22C55E',
  backgroundColor = '#E5E7EB',
  showLabel = true,
}: {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
}) {
  const animatedWidth = useAnimatedStyle(() => {
    return {
      width: withTiming(`${Math.min(100, Math.max(0, progress))}%` as unknown as number, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }),
    };
  });

  return (
    <View className="w-full">
      <View
        style={{
          height,
          backgroundColor,
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              backgroundColor: color,
              borderRadius: height / 2,
            },
            animatedWidth,
          ]}
        />
      </View>
      {showLabel && (
        <Text className="text-xs text-stone-500 mt-1 text-right">{progress}%</Text>
      )}
    </View>
  );
}
