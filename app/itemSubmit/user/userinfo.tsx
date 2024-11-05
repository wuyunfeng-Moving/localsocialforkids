import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView, Image, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const UserInfoScreen = () => {
  const { userInfo, loginState } = useWebSocket();

  const renderKidItem = ({ item }) => (
    <View style={styles.kidItem}>
      <View style={styles.kidPhotoContainer}>
        <Image
          source={{ uri: item.photoPath }}
          style={styles.kidPhoto}
        />
      </View>
      <Text style={styles.kidName}>{item.name}</Text>
      <Text style={styles.kidAge}>{`${item.age}岁`}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {loginState.logined ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.photoContainer}>
                <Image
                  source={require('@/assets/images/people.jpg')}
                  style={styles.userPhoto}
                />
              </View>
              <View style={styles.userTextInfo}>
                <Text style={styles.title}>{userInfo.name}</Text>
                <Text style={styles.emailText}>{userInfo.email}</Text>
              </View>
            </View>
          </View>
          <View style={styles.userInfoContainer}>
            {/* <View style={styles.userInfoItem}>
              <MaterialIcons name="email" size={24} color="#666" />
              <Text style={styles.label}>邮箱：</Text>
              <Text style={styles.value}>{userInfo.email}</Text>
            </View> */}

            <TouchableOpacity 
              style={styles.updateButton} 
              onPress={() => router.push('/itemSubmit/user/editProfile')}
            >
              <Text style={styles.updateButtonText}>编辑资料</Text>
            </TouchableOpacity>

            <View style={styles.kidSection}>
              <View style={styles.kidSectionHeader}>
                <MaterialIcons name="child-care" size={24} color="#666" />
                <Text style={styles.label}>孩子信息：</Text>
              </View>
              {userInfo?.kidinfo && userInfo.kidinfo.length > 0 ? (
                <View>
                  <FlatList
                    data={userInfo.kidinfo}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        onPress={() => router.push(`../user/kidsDetail/${item.id}`)}
                        style={styles.kidItem}
                      >
                        {renderKidItem({ item })}
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.kidList}
                  />
                </View>
              ) : (
                <Text style={styles.noKidsText}>暂无孩子信息</Text>
              )}
            </View>
          </View>
        </>
      ) : (
        <View style={styles.notLoggedInContainer}>
          <MaterialIcons name="lock" size={60} color="#999" />
          <Text style={styles.notLoggedInText}>未���录</Text>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  userPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userTextInfo: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emailText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
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
  kidSection: {
    marginTop: 20,
  },
  kidSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kidList: {
    paddingVertical: 8,
  },
  kidItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  kidPhotoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  kidPhoto: {
    width: '100%',
    height: '100%',
  },
  kidName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kidAge: {
    fontSize: 12,
    color: '#666',
  },
  noKidsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  inputError: {
    borderBottomColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});

export default UserInfoScreen;
