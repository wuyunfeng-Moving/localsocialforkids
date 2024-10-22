import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView, Image } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';
import { MaterialIcons } from '@expo/vector-icons';

const UserInfoScreen = () => {
  const { userInfo, loginState } = useWebSocket();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [kids, setKids] = useState([]);

  useEffect(() => {
    try {
      console.log("userinfo.tsx:", userInfo, loginState);
      if (loginState.logined && userInfo) {
        setName(userInfo?.username || '');
        setEmail(userInfo?.email || '');
        setKids(userInfo.kidinfo || []);
      }
    } catch (error) {
      console.log('error:', error);
    }
  }, [userInfo, loginState.logined]);

  return (
    <ScrollView style={styles.container}>
      {loginState.logined ? (
        <>
          <View style={styles.header}>
            <View style={styles.photoContainer}>
              <Image
                source={require('@/assets/images/people.jpg')}
                style={styles.userPhoto}
              />
            </View>
            <Text style={styles.title}>{name}</Text>
          </View>
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfoItem}>
              <MaterialIcons name="email" size={24} color="#666" />
              <Text style={styles.label}>邮箱：</Text>
              <Text style={styles.value}>{email}</Text>
            </View>
            <View style={styles.userInfoItem}>
              <MaterialIcons name="child-care" size={24} color="#666" />
              <Text style={styles.label}>孩子：</Text>
              <Text style={styles.value}>{kids.length > 0 ? kids.join(', ') : '无'}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.notLoggedInContainer}>
          <MaterialIcons name="lock" size={60} color="#999" />
          <Text style={styles.notLoggedInText}>未登录</Text>
        </View>
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333',
  },
  userInfoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    marginRight: 8,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  notLoggedInText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 16,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 12,
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
});

export default UserInfoScreen;
