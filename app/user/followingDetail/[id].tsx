import React, { useState, useEffect } from 'react';
import { UserInfo } from '../../types/types';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '../../context/WebSocketProvider';

const FollowingUserPage: React.FC = () => {
  const { id } = useLocalSearchParams();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const { getUserInfo,followActions } = useWebSocket();
  useEffect(() => {
    const userId = typeof id === 'string' ? parseInt(id) : 0;
    getUserInfo(userId,(userInfo,kidEvents,userEvents) => {
      setUserInfo(userInfo);
    });
  }, [id]);

  const handleFollowToggle = async () => {
    try {
        if(isFollowing){
            await followActions.unfollowUser({
                userId: Number(id),
                callback: () => {
                    setIsFollowing(false);
                    Alert.alert('提示', '已取消关注');
                }
            });
        } else {
            await followActions.followUser({
                userId: Number(id),
                callback: () => {
                    setIsFollowing(true);
                    Alert.alert('提示', '关注成功');
                }
            });
        }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      Alert.alert('错误', '操作失败，请稍后重试');
    }
  };

  if (!userInfo) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Image source={{ uri: userInfo.photoPath }} style={styles.avatar} />
      <Text style={styles.fullName}>{userInfo.username}</Text>
      <Text style={styles.username}>@{userInfo.username}</Text>
      <Text style={styles.bio}>{userInfo.introduction}</Text>
      {userInfo.following && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Following: {userInfo.following?.length}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.followButton, isFollowing && styles.followingButton]} 
        onPress={handleFollowToggle}
      >
        <Text style={styles.followButtonText}>
          {isFollowing ? '取消关注' : '关注'}
        </Text>
      </TouchableOpacity>
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
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  followingButton: {
    backgroundColor: '#gray',
  },
  followButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FollowingUserPage;
