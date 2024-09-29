import { useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import serverData from './serverData';
import { MatchEvents,MatchEvent } from '../types/types';
import {Event} from '../types/types';

const WebSocketContext = createContext(null);

// const SERVERIP ="121.196.198.126"
const SERVERIP ="localhost"
const PORT = "8080"

// 定义 KidInfo 接口
interface KidInfo {
  birthdate: string;
  gender: 'male' | 'female';
  id: number;
  name: string;
  relation: string;
  type: 'addkidinfo';
  user_id: number;
}

// 定义 UserInfo 接口
interface UserInfo {
  email: string;
  id: number;
  username: string;
  kidinfo: [];
}

export const useWebSocket = () => {
  try {
    return useContext(WebSocketContext);
  } catch (e) {
    console.log(e);
  }
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

  const [events, setEvents] = useState([]);
  const { userEvents,
    kidEvents,
    matchedEvents,
    loginState,
    userInfo,
    token,
    messageHandle, } = serverData();

  useEffect(() => {
    messageHandlers.forEach((handler) => {
      console.log(handler.name);
      handler.handle(messageFromserver);
    })
  }, [messageFromserver]);

  const send = useCallback((data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected or not ready, can\'t send the data');
      return;
    }

    console.log("Sending data:", data);
    ws.send(JSON.stringify(data));
  }, [ws, loginState]);

  // console.log("read the token from stroge:", token);

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
          }
      }
    } catch (e) {
      console.error('Error in orderToServer:', e);
    }
  };

  function handleMessages(event) {
    const message = JSON.parse(event.data);
    setMessageFromServer(message);
    messageHandle(message);

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
    const wsaddress="ws://"+SERVERIP+":"+PORT;
    const socket = new WebSocket(wsaddress);
    socket.onopen = () => {
      // console.log('WebSocket connected successfully');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      // console.log('WebSocket message received in context:', event.data);
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
        send({ type: 'verifyToken', token: token });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [ws]);
  // console.log('Rendering WebSocketProvider, userInfo:', userInfo); // Added this line
  return (
    <WebSocketContext.Provider value={{
      send, //send data derict to server,not recommand
      userInfo,
      loginState,
      registerMessageHandle,
      orderToServer,//app page send task for communicate with server
      //getmetch:get all the metches of user created events.
      events,
      userEvents,//user created events
      kidEvents,//kids involved events
      getMatchEvents,
      isEventBelongToUser,//check if the event belong to user
      isParticipateEvent,//check 用户是否参与事件
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};