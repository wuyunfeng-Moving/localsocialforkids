import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';

const LoginStatus = ({ onLoginButtonPress }) => {
  const { loginState, userInfo } = useWebSocket();

  return (
    <View>
      {userInfo ?
        <Text>当前用户：{userInfo.userinfo.username}</Text> :
        <View>
          <Text>Not Logged In</Text>
          <Button title="Login" onPress={onLoginButtonPress} />
        </View>
      }
    </View>
  );
}

export default LoginStatus;

