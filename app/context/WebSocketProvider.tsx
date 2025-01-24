import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useServerData, SERVERIP, ServerData } from './serverData';
import { MatchEvents, MatchEvent, ChatMessagesArray, ChatMessage, LoginState, BaseResponse, RegisterResponse, UserDataResponse } from '../types/types';
import { Event,UserInfo,KidInfo } from '../types/types';
import { UseMutationResult } from '@tanstack/react-query';
import { Notification } from '../types/notification_types';

// Define the type for the context value
export interface AllEvents {
  created: Event[];
  participating: Event[];
  applied: Event[];
}

interface WebSocketContextValue extends Omit<ServerData, 'websocketMessageHandle' | 'setWebSocketConnected'> {
  // Add only WebSocket-specific properties here if needed
  serverData:ServerData;
}

// Create the context with the defined type
const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// const SERVERIP = "121.196.198.126"
const PORT = "8080"

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (context === null) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// 定义一个类型别名
type GetMatchEventsFunction = (eventId: number) => MatchEvent[];

interface MessageHandler {
  name: string;
  handle: (message: any) => void;
}

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [messageFromserver, setMessageFromServer] = useState(null);
  const [messageHandlers, setMessageHandlers] = useState<MessageHandler[]>([]);
  const [messageQueue, setMessageQueue] = useState([]);

  const serverData = useServerData();
  const { 
    setWebSocketConnected,
    token,
    websocketMessageHandle,
    logout
  } = serverData;

  useEffect(() => {
    messageHandlers.forEach((handler) => {
      console.log(handler.name);
      handler.handle(messageFromserver);
    })
  }, [messageFromserver]);

  const send = useCallback((data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected or not ready, queuing message');
      setMessageQueue(prevQueue => [...prevQueue, data]);
      return;
    }

    const messageWithToken = {
      ...data,
      token: token
    };
    
    try {
      ws.send(JSON.stringify(messageWithToken));
    } catch (error) {
      console.error("Error sending data:", error);
      setMessageQueue(prevQueue => [...prevQueue, data]);
    }
  }, [ws, token]);

  async function handleMessages(event) {
    const message = JSON.parse(event.data);
    setMessageFromServer(message);
    
    // Handle specific message types
    switch (message.type) {
      case 'error':
        if (message.message === '无效的token') {
          // Invalid token - trigger logout
          logout();
        }
        break;
      case 'token':
        // Token validation successful
        if (message.success) {
          console.log('WebSocket authentication successful');
        }
        break;
    }
    
    await websocketMessageHandle(message);
  }

  const getMatchEvents: GetMatchEventsFunction = (eventId) => {
    // console.log("getMatchEvents::::",matchedEvents);
    if (!serverData.matchedEvents) {
      return [];
    }
    const result = serverData.matchedEvents[eventId] || [];
    // console.log("getMatchEvents",result);
    return result;
  };

  const isParticipateEvent = (event:Event) => {
    if (!serverData.userInfo || !serverData.userInfo.kidinfo || !Array.isArray(serverData.userInfo.kidinfo)) {
      return false;
    }

    return serverData.userInfo.kidinfo.some(kid => event.kidIds.includes(kid.id));
  }


  /*
  所有的与服务器的发送通信都是通过此接口。
  通信是以json格式：
  token:token
  type:type
  
  */


  const connectWebSocket = useCallback(() => {
    if (!token) {
      console.log('No token available, skipping WebSocket connection');
      return;
    }

    // console.log('Attempting to connect WebSocket...');
    const wsaddress = `ws://${SERVERIP}:${PORT}`;
    const socket = new WebSocket(wsaddress);
    
    socket.onopen = () => {
      // console.log('WebSocket connected successfully');
      setWs(socket);
      //send token to server
      send({type:"token",token:token});
    };

    socket.onmessage = (event) => {
      console.log('WebSocket message received in context:', event.data);
      // Handle incoming messages here
      handleMessages(event);
    };
    socket.onclose = (event) => {
      console.log('WebSocket disconnected', event.reason);
      // Only attempt reconnection if still logged in
      if (serverData.loginState.logined && token) {
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [token]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (token) {
      console.log('User is logged in with valid token, connecting WebSocket...');
      // Clear any existing connection first
      if (ws) {
        ws.close();
        setWs(null);
      }
      cleanup = connectWebSocket();
    } else {
      // Close WebSocket connection when not logged in
      console.log('Closing WebSocket connection - user logged out or invalid token');
      if (ws) {
        ws.close();
        setWs(null);
        setWebSocketConnected(false);
      }
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [token]);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && messageQueue.length > 0) {
      console.log('Attempting to send queued messages');
      messageQueue.forEach(message => send(message));
      setMessageQueue([]);
    }
  }, [ws, messageQueue, send]);

  return (
    <WebSocketContext.Provider value={{
      ...serverData,
      serverData:serverData,
      // Override or add any WebSocket-specific properties here if needed
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
