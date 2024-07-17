import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Keychain from 'react-native-keychain';

const storeToken = async (token) => {
  try {
    await Keychain.setGenericPassword('user', token);
  } catch (e) {
    // saving error
  }
};

const getToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials) {
      return credentials.password;
    }
  } catch (e) {
    // reading error
  }
  return null;
};



const WebSocketContext = createContext(null);


export const useWebSocket = () => {
  console.log('useWebSocket');
  try {
    return useContext(WebSocketContext);
  } catch (e) {
    console.log(e);
  }
};

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [ws, setWs] = useState(null);
  const [messageHandle, setMessageHandle] = useState([]);
  const [loginState,setLoginState] = useState({
    logined: false,
    userName: '',
    error: ''
  });


  console.log('WebSocketProvider start!');

  const token =getToken();
  

  function handleMessages(event) {
    const message = JSON.parse(event.data);

    // Handle incoming messages here
    messageHandle.forEach((handle) => {
      handle(message);
    });

    if (message.type === 'login') {
      //clear loginState
      setLoginState({'userName':'','logined':false,'error':''});
      
      if (message.success) {
        console.log("get the data", message.token);
        storeToken(message.token);
        setLoginState({'userName':message.name,'logined':true,'error':''});
        
      } else {
        console.log("get the error", message.message);
        setLoginState({'userName':'','logined':false,'error':message.message});
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

  const send = async (data) => {
    if (!ws) {
      console.log('WebSocket not connected');
      return;
    }

    data.token = token;

    ws.send(JSON.stringify(data));
  };

  const connectWebSocket = useCallback(() => {
    const socket = new WebSocket('ws://47.98.112.211:8080');
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
    socket.onmessage = (event) => {
      console.log('WebSocket message received in context:', event.data);
      // Handle incoming messages here
      handleMessages(event);
    };
    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  return (
    <WebSocketContext.Provider value={{ send, loginState, registerMessageHandle, connectWebSocket }}>
      {children}
    </WebSocketContext.Provider>
  );
};
