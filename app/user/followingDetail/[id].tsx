import React from 'react';
import { UserInfo } from '../../types/types';
import { View, Text, Image, StyleSheet } from 'react-native';

interface FollowingUserProps {
  userInfo: UserInfo;
}

const FollowingUserPage: React.FC<FollowingUserProps> = ({ userInfo }) => {
  // 初始化一个示例 userInfo
  const sampleUserInfo: UserInfo = {
    id: '1',
    username: 'johndoe',
    fullName: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Passionate developer and tech enthusiast',
    followersCount: 1000,
    followingCount: 500,
  };

  // 使用 props 中的 userInfo，如果没有则使用示例数据
  const user = userInfo || sampleUserInfo;

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <Text style={styles.fullName}>{user.fullName}</Text>
      <Text style={styles.username}>@{user.username}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Followers: {user.followersCount}</Text>
        <Text style={styles.statsText}>Following: {user.followingCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FollowingUserPage;
