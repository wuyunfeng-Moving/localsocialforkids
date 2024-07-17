import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const LoginStatus = ({ isLoggedIn, username,onLoginButtonPress }) => {
  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <Text style={styles.text}>Welcome, {username}!</Text>
      ) : (
        <View>
        <Text style={styles.text}>You are not logged in.</Text>
        <Button title="Login" onPress={onLoginButtonPress} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});

export default LoginStatus;
