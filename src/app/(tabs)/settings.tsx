import React from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import useAppStore from '@/lib/state/app-store';
import { SeasonProfile } from '@/lib/types';
import {
  Sun,
  Snowflake,
  Plane,
  Shield,
  Home,
  RotateCcw,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const userRole = useAppStore((s) => s.userRole);
  const userName = useAppStore((s) => s.userName);
  const currentSeason = useAppStore((s) => s.currentSeason);
  const setUserRole = useAppStore((s) => s.setUserRole);
  const setSeason = useAppStore((s) => s.setSeason);
  const resetToDefaultTasks = useAppStore((s) => s.resetToDefaultTasks);

  const handleRoleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUserRole(userRole === 'owner' ? 'sitter' : 'owner');
  };

  const handleSeasonSelect = async (season: SeasonProfile) => {
    await Haptics.selectionAsync();
    setSeason(season);
  };

  const handleResetTasks = () => {
    Alert.alert(
      'Reset to Default Tasks',
      'This will replace all tasks with the default set and clear completion history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetToDefaultTasks();
          },
        },
      ]
    );
  };

  const seasons: { id: SeasonProfile; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'summer', label: 'Summer', icon: <Sun size={20} color="#F59E0B" />, color: '#FEF3C7' },
    { id: 'winter', label: 'Winter', icon: <Snowflake size={20} color="#3B82F6" />, color: '#DBEAFE' },
    { id: 'away', label: 'Away', icon: <Plane size={20} color="#8B5CF6" />, color: '#EDE9FE' },
  ];

  return (
    <ScrollView className="flex-1 bg-amber-50/50">
      <View className="px-4 py-6">
        {/* User Profile Section */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-stone-100">
            <View className="flex-row items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center mr-4">
                {userRole === 'owner' ? (
                  <Shield size={28} color="#C2410C" />
                ) : (
                  <Home size={28} color="#C2410C" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-stone-800">{userName}</Text>
                <Text className="text-sm text-stone-500 capitalize">
                  {userRole === 'owner' ? 'Property Owner' : 'House Sitter'}
                </Text>
              </View>
            </View>

            {/* Role Toggle */}
            <View className="flex-row items-center justify-between pt-4 border-t border-stone-100">
              <View>
                <Text className="text-base font-medium text-stone-700">Owner Mode</Text>
                <Text className="text-xs text-stone-400">
                  Access dashboard & task management
                </Text>
              </View>
              <Switch
                value={userRole === 'owner'}
                onValueChange={handleRoleToggle}
                trackColor={{ false: '#D1D5DB', true: '#FDBA74' }}
                thumbColor={userRole === 'owner' ? '#C2410C' : '#fff'}
              />
            </View>
          </View>
        </Animated.View>

        {/* Season Profile Section - Only for owners */}
        {userRole === 'owner' && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text className="text-lg font-bold text-stone-800 mb-3">Season Profile</Text>
            <Text className="text-sm text-stone-500 mb-4">
              Switch profiles to enable/disable seasonal tasks
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 mb-6">
              {seasons.map((season, index) => (
                <Pressable
                  key={season.id}
                  onPress={() => handleSeasonSelect(season.id)}
                  className={`flex-row items-center p-4 ${
                    index < seasons.length - 1 ? 'border-b border-stone-100' : ''
                  }`}
                >
                  <View
                    style={{ backgroundColor: season.color }}
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  >
                    {season.icon}
                  </View>
                  <Text className="text-base text-stone-700 flex-1">{season.label}</Text>
                  {currentSeason === season.id && (
                    <View className="w-6 h-6 rounded-full bg-orange-500 items-center justify-center">
                      <View className="w-2.5 h-2.5 rounded-full bg-white" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Reset Tasks Section - Only for owners */}
        {userRole === 'owner' && (
          <Animated.View entering={FadeInDown.delay(150).duration(300)}>
            <Pressable
              onPress={handleResetTasks}
              className="bg-white rounded-2xl p-4 flex-row items-center mb-6 shadow-sm border border-stone-100 active:bg-stone-50"
            >
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                <RotateCcw size={20} color="#DC2626" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-stone-800">Reset to Default Tasks</Text>
                <Text className="text-xs text-stone-500">
                  Restore original tasks and clear history
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Info Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <View className="bg-stone-100 rounded-2xl p-5">
            <Text className="text-base font-semibold text-stone-700 mb-2">
              About Housemate
            </Text>
            <Text className="text-sm text-stone-500 leading-5">
              This app helps house sitters manage daily and weekly tasks for property care.
              Tasks are designed to take about 1 hour per day total.
            </Text>
            <View className="mt-4 pt-4 border-t border-stone-200">
              <Text className="text-xs text-stone-400">
                Daily tasks reset each day{'\n'}
                Weekly tasks reset on Monday{'\n'}
                Seasonal tasks are controlled by the owner
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
