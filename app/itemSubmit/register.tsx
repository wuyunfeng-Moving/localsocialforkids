import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';
import { configureLayoutAnimationBatch } from 'react-native-reanimated/lib/typescript/reanimated2/core';

const RegisterScreen = ({ closeModal }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

const {send,registerMessageHandle,connectWebSocket} = useWebSocket();

const handleMessages = (message) => {
  if(message.type === 'register'){

  if (message.success) {
    setSuccessMessage('注册成功');
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 2000);
  } else {
    setError(message.message);
  }
  registerMessageHandle(false,handleMessages);
}
  
};

  const handleRegister = async () => {
    send({ type: 'register', username, email, password });

    registerMessageHandle(true,handleMessages);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
      <View style={{flexDirection:'row',justifyContent:'space-around'}}>
      <Button title="Cancel" onPress={() =>closeModal()} />
      <Button title="Register" onPress={handleRegister} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
  success: {
    color: 'green',
    marginBottom: 12,
  },
});

export default RegisterScreen;
