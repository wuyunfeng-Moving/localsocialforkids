import { useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Keychain from 'react-native-keychain';

const storeToken = async (token) => {
  try {
    await Keychain.setGenericPassword('user', token);
  } catch (e) {
    // saving error
    console.error('Error saving token:', e);
    return null;
  }
};

const getToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword();
    return credentials ? credentials.password : null;
  } catch (e) {
    console.error('Error reading token:', e);
    return null;
  }
};


const WebSocketContext = createContext(null);


export const useWebSocket = () => {
  try {
    return useContext(WebSocketContext);
  } catch (e) {
    console.log(e);
  }
};

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [token, setToken] = useState(null);
  const [messageHandle, setMessageHandle] = useState([]);
  const [loginState, setLoginState] = useState({
    logined: false,
    error: ''
  });
  const [userInfo, setUserInfo] = useState(null);

  console.log("read the token from stroge:", token);

  useEffect(() => {
    getToken().then(fetchedToken => {
      console.log("Read token from storage:", fetchedToken);
      setToken(fetchedToken);
    });
  }, []);


  function handleMessages(event) {
    const message = JSON.parse(event.data);

    // Handle incoming messages here
    messageHandle.forEach((handle) => {
      handle(message);
    });

    if (message.type === 'login') {
      //clear loginState
      setLoginState({'logined': false, 'error': '' });

      if (message.success) {
        console.log("get the data", message.token);
        storeToken(message.token);
        // console.log("store token:",message.token);
        setLoginState({'logined': true, 'error': '' });

        //check if userinfo is exist and store it
        if (message.userInfo) {
          setUserInfo(message.userInfo);
        }
      } else {
        console.log("get the error", message.message);
        setLoginState({'logined': false, 'error': message.message });
      }
    }
    else if (message.type === 'authentication') {
      if (message.success) {
        setLoginState({ 'logined': true, 'error': '' });
        if (message.userInfo) {
          setUserInfo(message.userInfo);
        }
      }
      else {
        setLoginState({'logined': false, 'error': message.message });
      }
    }
  }

  useEffect(() => {
    console.log('loginState in provider:', loginState);
  }
    , [loginState]);


  const registerMessageHandle = (on, handle) => {
    if (on === true) {
      //check if the handle is already in the messageHandle
      if (messageHandle.includes(handle)) {
        return;
      }
      setMessageHandle([...messageHandle, handle]);
    }
    else {
      setMessageHandle(messageHandle.filter((item) => item !== handle));
    }
  }


  /*
  所有的与服务器的发送通信都是通过此接口。
  通信是以json格式：
  token:token
  type:type
  
  */
  const send = useCallback((data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected or not ready, can\'t send the data');
      return;
    }

    if (!((token)||(data.type === 'login'))) {
      console.log('No token available, can\'t send the data');
      return;
    }

    console.log("Sending data:", { ...data, token });
    ws.send(JSON.stringify({ ...data, token }));
  }, [ws, token]);

  const connectWebSocket = useCallback(() => {
    console.log('Attempting to connect WebSocket...');
    const socket = new WebSocket('ws://47.98.112.211:8080');
    socket.onopen = () => {
      console.log('WebSocket connected successfully');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      console.log('WebSocket message received in context:', event.data);
      // Handle incoming messages here
      handleMessages(event);
    };
    socket.onclose = (event) => {
      console.log('WebSocket disconnected', event.reason);
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectWebSocket();
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const cleanup = connectWebSocket();

    return () => {
      if (cleanup) cleanup();
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && token) {
      const timer = setTimeout(() => {
        console.log('Attempting to send authentication after 10 seconds');
        send({ type: 'authentication' });
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [ws, token, send]);
  return (
    <WebSocketContext.Provider value={{ send, userInfo, loginState, registerMessageHandle, connectWebSocket }}>
      {children}
    </WebSocketContext.Provider>
  );
};
