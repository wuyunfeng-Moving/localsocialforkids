import { useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

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

  // console.log("read the token from stroge:", token);

  const storeToken = async (token) => {
    try {
      await SecureStore.setItemAsync('userToken', token);
      setToken(token); // Update state immediately after storing
    } catch (e) {
      console.error('Error saving token:', e);
    }
  };
  
  useEffect(() => {
    const fetchToken = async () => {
      const fetchedToken = await getToken();
      console.log("Read token from storage:", fetchedToken);
      setToken(fetchedToken);
    };
    fetchToken();
  }, []);
  
  const getToken = async () => {
    try {
      return await SecureStore.getItemAsync('userToken');
    } catch (e) {
      console.error('Error reading token:', e);
      return null;
    }
  };


  function handleMessages(event) {
    const message = JSON.parse(event.data);

    // Handle incoming messages here
    messageHandle.forEach((handle) => {
      handle(message);
    });

    if (message.type === 'login') {
      if (message.success) {
        console.log("Login successful, token:", message.token);
        storeToken(message.token);
        setLoginState({ logined: true, error: '' });
        setUserInfo(message.userinfo);
      } else {
        console.log("Login failed:", message.message);
        setLoginState({ logined: false, error: message.message });
      }
    }
    else if (message.type === 'authentication') {
      // console.log('Authentication message received:', message);
      if (message.success) {
        setLoginState({ logined: true, error: '' });
        setUserInfo(message.userinfo);
      } else {
        setLoginState({ logined: false, error: message.message });
        //clear the token
        // storeToken(null);
        setToken(null);
        setUserInfo(null);
      }
    }
  }

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
  
    console.log("Sending data:", data);
    ws.send(JSON.stringify(data));
  }, [ws, loginState]);

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
        send({ type: 'authentication', token: token });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [ws, token]);
  return (
    <WebSocketContext.Provider value={{ send, userInfo, loginState, registerMessageHandle, connectWebSocket }}>
      {children}
    </WebSocketContext.Provider>
  );
};
