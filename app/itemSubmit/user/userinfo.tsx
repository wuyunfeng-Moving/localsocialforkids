import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';

const UserInfoScreen = () => {
  const { userInfo, loginState } = useWebSocket();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [kids, setKids] = useState([]);

  useEffect(() => {
    try {
      if (loginState.logined && userInfo) {
        setName(userInfo.userinfo?.username || '');
        setEmail(userInfo.userinfo?.email || '');
        setKids(userInfo.kidinfo || []);
      }
    } catch (error) {
      console.log('error:', error);
    }
    // console.log('userInfo:', userInfo);
  }, [userInfo, loginState.logined]);

  return (
    <ScrollView style={styles.container}>
      {loginState.logined ? (
        <>
          <View style={styles.userInfo}>
            <Text style={styles.title}>User Info</Text>
            <Text style={styles.label}>Name: <Text style={styles.value}>{name}</Text></Text>
            <Text style={styles.label}>Email: <Text style={styles.value}>{email}</Text></Text>
          </View>
          <Text style={styles.kidsTitle}>Kids Info</Text>
          {kids.length > 0 ? (
            kids.map((kid, index) => (
              <View key={index} style={styles.kidInfo}>
                <Text style={styles.kidTitle}>Kid {index + 1}</Text>
                {Object.entries(kid).map(([key, value]) => (
                  <Text key={key} style={styles.label}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}: <Text style={styles.kidValue}>{value}</Text>
                  </Text>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.noKidsText}>No kids information available</Text>
          )}
        </>
      ) : (
        <Text style={styles.label}>Not logged in</Text>
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  kidsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  kidInfo: {
    backgroundColor: '#e6f3ff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  kidTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  kidValue: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  noKidsText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
  },
});

export default UserInfoScreen;