import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';

const LoginStatus = ({ onLoginButtonPress }) => {
  const { userInfo } = useWebSocket();

  return (
    <View>
      {userInfo ?
        <View></View> :
        <View>
          <Text>Not Logged In</Text>
          <Button title="Login" onPress={onLoginButtonPress} />
        </View>
      }
    </View>
  );
}

export default LoginStatus;

