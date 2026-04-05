import React from 'react';
import { View, Text } from 'react-native';
import { useSync } from '@/lib/hooks/useSync';
import useAppStore from '@/lib/state/app-store';

export function SyncStatus() {
  const { isLoading, error } = useSync();
  const isOnline = useAppStore((s) => s.isOnline);

  const dotColor = isLoading
    ? 'bg-amber-400'
    : error
    ? 'bg-red-400'
    : isOnline
    ? 'bg-green-400'
    : 'bg-stone-300';

  const label = isLoading
    ? 'Syncing...'
    : error
    ? 'Offline'
    : isOnline
    ? 'Live'
    : 'Local';

  return (
    <View className="flex-row items-center">
      <View className={`w-2 h-2 rounded-full ${dotColor} mr-1.5`} />
      <Text className="text-xs text-stone-400">{label}</Text>
    </View>
  );
}
