import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, ClipboardList, Settings, LayoutDashboard } from 'lucide-react-native';
import useAppStore from '@/lib/state/app-store';
import { SyncStatus } from '@/components/SyncStatus';

export default function TabLayout() {
  const initializeWithSeedData = useAppStore((s) => s.initializeWithSeedData);
  const userRole = useAppStore((s) => s.userRole);

  useEffect(() => {
    initializeWithSeedData();
  }, [initializeWithSeedData]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C2410C', // terracotta (orange-700)
        tabBarInactiveTintColor: '#A8A29E', // stone-400
        tabBarStyle: {
          backgroundColor: '#FEFBF6', // warm cream
          borderTopColor: '#E7E5E4', // stone-200
          paddingTop: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#C2410C', // terracotta (orange-700)
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          headerTitle: 'Housemate',
          headerRight: () => (
            <View style={{ marginRight: 16 }}>
              <SyncStatus />
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title: 'This Week',
          headerTitle: 'Weekly Tasks',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="owner"
        options={{
          title: 'Dashboard',
          headerTitle: 'Owner Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
          href: userRole === 'owner' ? '/owner' : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
