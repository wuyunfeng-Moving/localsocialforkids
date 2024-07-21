import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';

const UserInfoScreen = () => {
  const { userInfo, isLoggedIn } = useWebSocket();
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      setName(userInfo.name);
      setAge(userInfo.age);
      setGender(userInfo.gender);
    }
  }, [userInfo, isLoggedIn]);

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <>
          <Text style={styles.label}>Name: {name}</Text>
          <Text style={styles.label}>Age: {age}</Text>
          <Text style={styles.label}>Gender: {gender}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          </View>
        </>
      ) : (
        <Text style={styles.label}>Not logged in</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  label: {
    fontSize: 18,
    marginBottom: 12,
  },
});

export default UserInfoScreen;