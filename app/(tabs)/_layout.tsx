import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { WebSocketProvider, useWebSocket } from '../context/WebSocketProvider';
import { LocationProvider } from '../context/LocationContext';

// 使用 Ionicons 替代 FontAwesome
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { notifications } = useWebSocket();

  // Calculate unread notifications count
  const unreadCount = notifications?.filter(notification => !notification.read).length || 0;

  return (
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
            headerShown: useClientOnlyValue(false, true),
            tabBarStyle: {
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderTopWidth: 1,
              borderTopColor: Colors[colorScheme ?? 'light'].border,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: 'bold',
            },
            headerRight: () => (
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <Ionicons
                      name="information-circle-outline"
                      size={25}
                      color={Colors[colorScheme ?? 'light'].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: '活动列表',
              tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
            }}
          />
          <Tabs.Screen
            name="notification"
            options={{
              title: '通知',
              tabBarIcon: ({ color }) => <TabBarIcon name="notifications" color={color} />,
              tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
              tabBarBadgeStyle: {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
              },
            }}
          />
          <Tabs.Screen
            name="addEvent"
            options={{
              title: '提交活动',
              tabBarIcon: ({ color }) => <TabBarIcon name="add-circle" color={color} />,
            }}
          />
          <Tabs.Screen
            name="user"
            options={{
              title: '我的',
              tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
            }}
          />
        </Tabs>
  );
}
