import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import serverData from './serverData';
import comWithServer from './comWithServer';
import { MatchEvents, MatchEvent } from '../types/types';
import { Event,UserInfo,KidInfo } from '../types/types';
import { UseMutationResult } from 'react-query';

// Define the type for the context value
interface WebSocketContextValue {
  userInfo: UserInfo | null,
  getUserInfo: (userId: number,callback: (userInfo: UserInfo,kidEvents: KidInfo[],userEvents: Event[]) => void) => Promise<UserInfo>,
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
}

// Create the context with the defined type
const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const SERVERIP = "121.196.198.126"
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
    messageHandle,
    updateUserInfo,
    addkidinfo,
    deletekidinfo,
    login,
    logout,
    refreshUserData,
    getUserInfo,
    isUserDataLoading,
    changeEvent,
    searchEvents,
    followActions,
  } = serverData();

  // 将 userInfo 的类型明确声明为 UserInfo | null
  const [typedUserInfo, setTypedUserInfo] = useState<UserInfo | null>(null);

  // 使用 useEffect 来更新 typedUserInfo
  useEffect(() => {
    setTypedUserInfo(userInfo as UserInfo | null);
  }, [userInfo]);

  useEffect(() => {
    console.log("userEvents in context:", userEvents);
    // console.log("recommendEvents",recommendEvents);
  }, [userEvents]);
    

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

    console.log("Sending data:", JSON.stringify(data, null, 2));
    console.log("WebSocket readyState:", ws.readyState);
    console.log("Login state:", loginState);
    
    try {
      ws.send(JSON.stringify(data));
      console.log("Data sent successfully");
    } catch (error) {
      console.error("Error sending data:", error);
      setMessageQueue(prevQueue => [...prevQueue, data]);
    }
  }, [ws, loginState]);

  const setHandleForMessage = ((command, type, callbackAfterGetRes) => {
    const messageHandler = {
      name: command,
      handle: (message) => {
        if (message.type === type) {
          registerMessageHandle(false, messageHandler);

          if (callbackAfterGetRes) {
            callbackAfterGetRes(message);
          }
        }
      }
    }
    registerMessageHandle(true, messageHandler);
  });

  type OrderCommand = 'getMatch' | 'getUserEvents' | 'deleteEvent' | 'addNewEvent' | 'signUpEvent' | 'notifications'|'approveSignUp';
  type ParaOfOrder = {
    [key: string]: any;
    signUpEvent?: {
      sourceEventId: number;
      targetEventId: number;
      reason: string;
    };
    approveSignUp?: {
      eventId: number;
      targetEventId: number;
      approve: boolean;
    }
    setNotificationReaded?:{
      id:number;
    }
  };
  const orderToServer = async (command: OrderCommand, params: ParaOfOrder, callbackAfterGetRes?: (message: any) => void) => {
    try {
      switch (command) {
        case 'getMatch': {
          const { start = 0, end = 10 } = params;
          if (userEvents.length > 0) {
            for (const event of userEvents) {
              setHandleForMessage(`getMatch_${event.id}`, 'getMatch', callbackAfterGetRes);
              // Send the request
              send({ type: 'getMatch', eventId: event.id, start, end });
            }
          }
          break;
        }
        case 'getUserEvents': {
          setHandleForMessage(command, 'getUserEvents', callbackAfterGetRes);
          send({ type: 'getUserEvents', userId: userInfo?.id });
          break;
        }
        case 'deleteEvent': {
          const { event = null } = params;
          setHandleForMessage(command, 'deleteEvent', callbackAfterGetRes);
          if (event) {
            send({ type: 'deleteEvent', eventId: event.id });
          }
          break;
        }
        //同名命令
        case 'addNewEvent': {
          // console.log("Adding new event");
          const { event = null } = params;
          setHandleForMessage(command, command, callbackAfterGetRes);
          if (event) {
            event.type = command;
            send(event);
          }
          break;
        }
        case 'approveSignUp': {
          setHandleForMessage(command, command, callbackAfterGetRes);
          const { approve, eventId, targetEventId } = params.approveSignUp || {};
          if (approve !== undefined && eventId !== undefined && targetEventId !== undefined) {
            send({
              type: command,
              approve,
              eventId,
              targetEventId
            });
          } else {
            console.error('Missing required parameters for approveSignUp');
          }
          break;
        }
        case 'signUpEvent':
          {
            setHandleForMessage(command, command, callbackAfterGetRes);
            const msg = {
              type: 'signUpEvent',
              targetEventId: params.signUpEvent?.targetEventId,
              sourceEventId: params.signUpEvent?.sourceEventId,
              reason: params.signUpEvent?.reason
            }
            send(msg);
            break;
          }
        case 'setNotificationReaded':
          {
            setHandleForMessage(command,command,callbackAfterGetRes);
            const msg={
              type:command,
              notificationId:params.setNotificationReaded?.id,
            }
            send(msg);
            break;
          }
      }
    } catch (e) {
      console.error('Error in orderToServer:', e);
    }
  };

  function handleMessages(event) {
    const message = JSON.parse(event.data);
    setMessageFromServer(message);
    messageHandle(message).then(res => {
        if(res) {
          setMessageQueue(prevQueue => [...prevQueue, res]);
        }
    });
  }

  const registerMessageHandle = (on: boolean, handler: MessageHandler) => {
    if (on) {
      setMessageHandlers(prevHandlers => {
        if (!prevHandlers.some(h => h.name === handler.name)) {
          const newHandlers = [...prevHandlers, handler];
          // console.log('Updated message handlers:', newHandlers);
          return newHandlers;
        }
        return prevHandlers;
      });
    } else {
      setMessageHandlers(prevHandlers => {
        const updatedHandlers = prevHandlers.filter(h => h.name !== handler.name);
        console.log('Updated message handlers:', updatedHandlers);
        return updatedHandlers;
      });
    }
  };

  const getMatchEvents: GetMatchEventsFunction = (eventId) => {
    // console.log("getMatchEvents::::",matchedEvents);
    if (!matchedEvents) {
      return [];
    }
    const result = matchedEvents[eventId] || [];
    // console.log("getMatchEvents",result);
    return result;
  };

  const isEventBelongToUser = (userId:number) => {
    return userId === userInfo?.id;
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
    console.log('Attempting to connect WebSocket...');
    const wsaddress = "ws://" + SERVERIP + ":" + PORT;
    const socket = new WebSocket(wsaddress);
    
    socket.onopen = () => {
      // console.log('WebSocket connected successfully');
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
    if (ws && ws.readyState === WebSocket.OPEN && messageQueue.length > 0) {
      console.log('Attempting to send queued messages');
      messageQueue.forEach(message => send(message));
      setMessageQueue([]);
    }
  }, [ws, messageQueue, send]);

  const {
    handleDeleteEvent,
    handleSignupEvent,
    markNotificationAsRead,
    acceptSignUp
  } = comWithServer(orderToServer, kidEvents, notifications);

  return (
    <WebSocketContext.Provider value={{
      send,
      userInfo: typedUserInfo,
      loginState,
      registerMessageHandle,
      getUserInfo:getUserInfo,
      // events,
      userEvents,
      kidEvents,
      getMatchEvents,
      isEventBelongToUser,
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
      changeEvent,
      followActions,
      comWithServer: {
        handleDeleteEvent,
        handleSignupEvent,
        markNotificationAsRead,
        acceptSignUp
      }
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
