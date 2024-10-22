import { Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useNavigation } from 'expo-router';

export default function UserLayout() {
  const navigation = useNavigation();

  return (
    <Stack screenOptions={{
      headerBackTitle: "返回",
      headerBackTitleVisible: true,
      headerTitleAlign: 'center',
      headerShown: false, // 显示堆栈导航的头部
      headerTitle: () => null,
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: '#007AFF' }}>返回</Text>
        </Pressable>
      ),
    }}>
      <Stack.Screen
        name="kids"
        options={{
          title: '孩子列表',
          headerTitle: "孩子列表",
          headerBackVisible: true,
          headerShown: true, // 显示 kids 页面的头部
        }}
      />
      <Stack.Screen
        name = "following"
        options={{
            title:"我的关注",
            headerBackVisible: true,
            headerShown: true, // 显示 kids 页面的头部
        }
        }
        />
    </Stack>
  );
}
