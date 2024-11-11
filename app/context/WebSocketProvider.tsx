import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useServerData, SERVERIP } from './serverData';
import { MatchEvents, MatchEvent, ChatMessagesArray, ChatMessage, LoginState } from '../types/types';
import { Event,UserInfo,KidInfo } from '../types/types';
import { UseMutationResult } from '@tanstack/react-query';
import { Notification } from '../types/notification_types';

// Define the type for the context value
export interface AllEvents {
  created: Event[];
  participating: Event[];
  applied: Event[];
}

interface WebSocketContextValue {
  userInfo: UserInfo | null,
  userEvents: Event[],
  kidEvents: KidInfo[],
  loginState: LoginState,
  notifications: Notification[],
  refreshUserData: () => void,
  isUserDataLoading: boolean,
  isParticipateEvent: (event:Event) => boolean,
  getUserInfo: (userId: number,callback: (userInfo: UserInfo,kidEvents: KidInfo[],userEvents: Event[]) => void) => Promise<UserInfo>,
  getKidInfo: (kidId: number, callback: (kidInfo: KidInfo) => void, forceUpdate: boolean) => Promise<void>,
  searchEvents: {
    search: (searchParams: {
      keyword?: string;
      startDate?: string;
      endDate?: string;
      location?: [number, number];  // [latitude, longitude]
      radius?: number;  // in kilometers
      eventId?: number;
      callback?: (success:boolean,message:string,events: Event[]) => void;
    }) => Promise<void>;
    isSearching: boolean;
    searchError: Error | null;
    results: Event[];
  }
  changeEvent: {
    signupEvent: (signEventParams: {
      targetEventId: number;
      sourceEventId?: number;
      kidsId?: number[];
      reason: string;
      callback: (success: boolean, message: string) => void;
    }) => Promise<void>;
    approveSignupRequest: (params: {
      eventId: number;
      signupId: number;
      approved: boolean;
      rejectionReason?: string;
      callback: (success: boolean, message: string) => void;
    }) => Promise<void>;
    deleteEvent: (params: {
      eventId: number,
      callback: (success: boolean, message: string) => void
    }) => Promise<void>;
    submitComment: (params: {
      eventId: number;
      comment: string;
      callback: (success: boolean, message: string) => void;
    }) => Promise<void>;
  };
  update: {
    updateUserInfo: UseMutationResult<any, Error, {
      type: "addKidInfo" | "deleteKidInfo" | "updateKidInfo" | "deleteEvent" | "addEvent";
      newUserInfo: any;
    }>;
    addkidinfo: (
      newKidInfo: Partial<KidInfo>,
      callback: (success: boolean, message: string) => void
    ) => Promise<void>;
    deletekidinfo: (
      kidId:number,
      callback: (success: boolean, message: string) => void
    ) => Promise<void>;
  };
  followActions: {
    followUser: (params: { 
      userId: number; 
      callback: (success: boolean, message: string) => void 
    }) => Promise<void>;
    unfollowUser: (params: { 
      userId: number; 
      callback: (success: boolean, message: string) => void 
    }) => Promise<void>;
  };
  chat: {
    chatMessages: ChatMessagesArray;
    getChatHistory: (chatId: number, callback: (success: boolean, messages: ChatMessage[]) => void) => Promise<void>;
    sendMessage: (params: { chatId: number, message: string, callback: (success: boolean, message: string) => void }) => Promise<void>;
    createChat: (params: { eventId: number, callback: (success: boolean, message: string,chatId:number) => void }) => Promise<void>;
  };
  setNotificationsRead: (notificationId: number, callback: (success: boolean, message: string) => void) => Promise<void>;
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

  const { 
    notifications,
    userEvents,
    kidEvents,
    recommendEvents,
    matchedEvents,
    loginState,
    userInfo,
    token,
    websocketMessageHandle,
    chat,
    updateUserInfo,
    addkidinfo,
    deletekidinfo,
    login,
    logout,
    refreshUserData,
    getUserInfo,
    getKidInfo,
    isUserDataLoading,
    changeEvent,
    searchEvents,
    followActions,
    setNotificationsRead,
  } = useServerData();

  // 将 userInfo 的类型明确声明为 UserInfo | null
  const [typedUserInfo, setTypedUserInfo] = useState<UserInfo | null>(null);

  // 使用 useEffect 来更新 typedUserInfo
  useEffect(() => {
    setTypedUserInfo(userInfo as UserInfo | null);
  }, [userInfo]);    

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

    console.log("Sending data:", JSON.stringify(messageWithToken, null, 2));
    console.log("WebSocket readyState:", ws.readyState);
    
    try {
      ws.send(JSON.stringify(messageWithToken));
      console.log("Data sent successfully");
    } catch (error) {
      console.error("Error sending data:", error);
      setMessageQueue(prevQueue => [...prevQueue, data]);
    }
  }, [ws, token]);

  async function handleMessages(event) {
    const message = JSON.parse(event.data);
    setMessageFromServer(message);
    await websocketMessageHandle(message);
  }

  const getMatchEvents: GetMatchEventsFunction = (eventId) => {
    // console.log("getMatchEvents::::",matchedEvents);
    if (!matchedEvents) {
      return [];
    }
    const result = matchedEvents[eventId] || [];
    // console.log("getMatchEvents",result);
    return result;
  };

  const isParticipateEvent = (event:Event) => {
    if (!userInfo || !userInfo.kidinfo || !Array.isArray(userInfo.kidinfo)) {
      return false;
    }

    return userInfo.kidinfo.some(kid => event.kidIds.includes(kid.id));
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

    console.log('Attempting to connect WebSocket...');
    const wsaddress = `ws://${SERVERIP}:${PORT}`;
    const socket = new WebSocket(wsaddress);
    
    socket.onopen = () => {
      console.log('WebSocket connected successfully');
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
  }, [token]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (loginState.logined && token) {
      console.log('User is logged in with valid token, connecting WebSocket...');
      cleanup = connectWebSocket();
    } else {
      // Close existing connection if user logs out or token becomes invalid
      if (ws) {
        console.log('User logged out or token invalid, closing WebSocket connection');
        ws.close();
        setWs(null);
      }
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [loginState.logined, token, connectWebSocket]);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && messageQueue.length > 0) {
      console.log('Attempting to send queued messages');
      messageQueue.forEach(message => send(message));
      setMessageQueue([]);
    }
  }, [ws, messageQueue, send]);

  return (
    <WebSocketContext.Provider value={{
      send,
      userInfo: typedUserInfo,
      loginState,
      getUserInfo:getUserInfo,
      getKidInfo:getKidInfo,
      // events,
      userEvents,
      kidEvents,
      getMatchEvents,
      isParticipateEvent,
      login,
      logout,
      refreshUserData,
      isUserDataLoading,
      notifications,
      data: {
        recommendEvents,
        matchedEvents
      },
      update: {
        updateUserInfo,
        addkidinfo,
        deletekidinfo
      },
      searchEvents,
      changeEvent: {
        signupEvent: changeEvent.signupEvent,
        approveSignupRequest: changeEvent.approveSignupRequest,
        deleteEvent: changeEvent.deleteEvent,
        submitComment: changeEvent.addComment,
      },
      followActions,
      chat:{
        chatMessages: chat.chatMessages,
        getChatHistory: chat.getChatHistory,
        sendMessage: chat.sendMessage,
        createChat: chat.createChat
      },
      setNotificationsRead: setNotificationsRead
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
