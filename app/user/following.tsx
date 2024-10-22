import React from 'react';
import { useRouter } from 'expo-router';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';

interface FollowedUser {
  id: string;
  name: string;
  introduction: string;
}

const FollowingPage: React.FC = () => {
  const { data } = useWebSocket();
  const router = useRouter();

  const followedUsers: FollowedUser[] = data.following.map((user) => ({
    id: user.id,
    name: user.username,
    introduction: user.introduction,
  }));

  const renderUserItem = ({ item }: { item: FollowedUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => router.push(`./followingDetail/[id]`)}
    >
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userIntro}>{item.introduction}</Text>
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
