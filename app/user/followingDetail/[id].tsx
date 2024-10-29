import React, { useState, useEffect } from 'react';
import { UserInfo } from '../../types/types';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '../../context/WebSocketProvider';

const FollowingUserPage: React.FC = () => {
  const { id } = useLocalSearchParams();
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  const { getUserInfo,followActions,userInfo:myUserInfo } = useWebSocket();
  const [isFollowing,setIsFollowing] = useState(false);
  useEffect(() => {
    const userId = typeof id === 'string' ? parseInt(id) : 0;
    getUserInfo(userId,(userInfo,kidEvents,userEvents) => {
      setCurrentUserInfo(userInfo);
      setIsFollowing(myUserInfo?.following?.includes(userInfo.id) || false);
    });
  }, [id]);

  const handleFollowToggle = async () => {
    try {
        if(isFollowing){
            await followActions.unfollowUser({
                userId: parseInt(id),
                callback: () => {
                    Alert.alert('提示', '已取消关注');
                }
            });
        } else {
            await followActions.followUser({
                userId: parseInt(id),
                callback: () => {
                    Alert.alert('提示', '关注成功');
                }
            });
        }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      Alert.alert('错误', '操作失败，请稍后重试');
    }
  };

  if (!currentUserInfo) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentUserInfo.photoPath }} style={styles.avatar} />
      <Text style={styles.fullName}>{currentUserInfo.username}</Text>
      <Text style={styles.username}>@{currentUserInfo.username}</Text>
      <Text style={styles.bio}>{currentUserInfo.introduction}</Text>
      {currentUserInfo.following && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Following: {currentUserInfo.following?.length}</Text>
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
