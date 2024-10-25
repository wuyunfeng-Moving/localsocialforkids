import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView, Image, TextInput, TouchableOpacity } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';
import { MaterialIcons } from '@expo/vector-icons';

const UserInfoScreen = () => {
  const { userInfo, loginState, update } = useWebSocket();
  const [newEmail, setNewEmail] = useState(userInfo.email||'');

  useEffect(() => {
    console.log('Current userInfo:', userInfo);
  }, [userInfo]);

  const handleUpdateEmail = () => {
    // 这里应该调用 update 函数来更新邮箱
    update.updateUserInfo({ ...userInfo, email: newEmail ,type:'updateUserInfo'});
  };

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
            <Text style={styles.title}>{userInfo.name}</Text>
          </View>
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfoItem}>
              <MaterialIcons name="email" size={24} color="#666" />
              <Text style={styles.label}>邮箱：</Text>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="输入新的邮箱地址"
              />
            </View>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateEmail}>
              <Text style={styles.updateButtonText}>更新邮箱</Text>
            </TouchableOpacity>
            <View style={styles.userInfoItem}>
              <MaterialIcons name="child-care" size={24} color="#666" />
              <Text style={styles.label}>孩子：</Text>
              <Text style={styles.value}>{userInfo.kidinfo.length > 0 ? userInfo.kidinfo.join(', ') : '无'}</Text>
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
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 4,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserInfoScreen;
