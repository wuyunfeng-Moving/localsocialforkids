import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView, Image, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KidInfo } from '@/app/types/types';

const UserInfoScreen = () => {
  const { userInfo, loginState } = useWebSocket();


  const calculateAge = (birthDate: KidInfo['birthDate']) => {
    const today = new Date();
    const dateBirthDate = new Date(birthDate);
    const age = today.getFullYear() - dateBirthDate.getFullYear();
    return age;
  };

  const renderKidItem = ({ item }: { item: KidInfo }) => (
    <View style={styles.kidItem}>
      <View style={styles.kidPhotoContainer}>
        {item.photoPath && <Image
          source={{ uri: item.photoPath }}
          style={styles.kidPhoto}
        />}
      </View>
      <Text style={styles.kidName}>{item.name}</Text>
      <Text style={styles.kidAge}>{`${calculateAge(item.birthDate)}岁`}</Text>
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
                <Text style={styles.title}>{userInfo?.username}</Text>
                <Text style={styles.emailText}>{userInfo?.email}</Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => router.push('/itemSubmit/user/editProfile')}
              >
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.userInfoContainer}>
            {/* <View style={styles.userInfoItem}>
              <MaterialIcons name="email" size={24} color="#666" />
              <Text style={styles.label}>邮箱：</Text>
              <Text style={styles.value}>{userInfo.email}</Text>
            </View> */}

            <View style={styles.kidSection}>
              <View style={styles.kidSectionHeader}>
                <MaterialIcons name="child-care" size={24} color="#666" />
                <Text style={styles.label}>孩子信息：</Text>
              </View>
              {userInfo?.kidinfo ? (
                <View>
                  <FlatList
                    data={[...(userInfo.kidinfo || []), { id: 'add_button' }]}
                    renderItem={({ item }) => 
                      item.id === 'add_button' ? (
                        <TouchableOpacity 
                          style={styles.addKidItem}
                          onPress={() => router.push('/itemSubmit/user/addKid')}
                        >
                          <View style={styles.addKidCircle}>
                            <MaterialIcons name="add" size={30} color="#007AFF" />
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => router.push(`../user/kidsDetail/${item.id}`)}
                          style={styles.kidItem}
                        >
                          {renderKidItem({ item })}
                        </TouchableOpacity>
                      )
                    }
                    keyExtractor={(item) => item.id.toString()}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.kidList}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addKidItem}
                  onPress={() => router.push('/itemSubmit/user/addKid')}
                >
                  <View style={styles.addKidCircle}>
                    <MaterialIcons name="add" size={30} color="#007AFF" />
                  </View>
                </TouchableOpacity>
              )}
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
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
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
    fontSize: 14,
    color: '#666',
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
  addKidItem: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addKidCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default UserInfoScreen;
