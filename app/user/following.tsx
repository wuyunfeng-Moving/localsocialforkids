import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';

interface FollowedUser {
  id: string;
  name?: string;
  introduction: string;
}

const FollowingPage: React.FC = () => {
  const { userInfo, getUserInfo } = useWebSocket();
  const router = useRouter();
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      if (userInfo?.following) {
        const usersPromises = userInfo.following.map(async (userId) => {
          return new Promise<FollowedUser>((resolve) => {
            getUserInfo(userId, (userInfo) => {
              resolve({
                id: userInfo.id,
                name: userInfo.username,
                introduction: userInfo.introduction
              });
            });
          });
        });

        const users = await Promise.all(usersPromises);
        setFollowedUsers(users);
      }
    };

    fetchFollowedUsers();
  }, [userInfo]);

  const renderUserItem = ({ item }: { item: FollowedUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => router.push({
        pathname: '/followingDetail/[id]',
        params: { id: item.id }
      })}
    >
      <Text style={styles.userName}>{item.name || '未知用户'}</Text>
      <Text style={styles.userIntro}>{item.introduction || '暂无简介'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={followedUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userIntro: {
    fontSize: 14,
    color: '#666',
  },
});

export default FollowingPage;
