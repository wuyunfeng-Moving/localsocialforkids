import { useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';


const WebSocketContext = createContext(null);

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

interface MessageHandler {
  name: string;
  handle: (message: any) => void;
}

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const messageHandlersRef = useRef<MessageHandler[]>([]);
  const providerIdRef = useRef(Date.now()); // 创建一个唯一的标识符
  const [token, setToken] = useState(null);
  const [messageFromserver,setMessageFromServer] = useState(null);
  const [messageHandlers, setMessageHandlers] = useState<MessageHandler[]>([]);
  const [loginState, setLoginState] = useState({
    logined: false,
    error: ''
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [events, setEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [kidEvents, setKidEvents] = useState([]);
  const [matchedEvents, setMatchedEvents] = useState({});

  // console.log("read the token from stroge:", token);

  const storeToken = async (token) => {
    try {
      await SecureStore.setItemAsync('userToken', token);
      setToken(token); // Update state immediately after storing
    } catch (e) {
      console.error('Error saving token:', e);
    }
  };

  const orderToServer = async (command, params = {}, callbackAfterGetRes) => {
    try {
      if (command === 'getMatch') {
        const { start = 0, end = 10 } = params;
        if (userEvents.length > 0) {
          for (const event of userEvents) {
            const messageHandler = {
              name: `getMatch_${event.id}`,
              handle: (message) => {
                if (message.type === 'getMatch') {
                  // Remove this handler after processing
                  registerMessageHandle(false, messageHandler);
                  // Call the callback with the response
                  if (callbackAfterGetRes) {
                    callbackAfterGetRes(message);
                  }
                }
              }
            };
            // Register the message handler
            registerMessageHandle(true, messageHandler);
            // Send the request
            send({ type: 'getMatch', eventId: event.id, start, end });
          }
        }
      }
    else if(command === 'getUserEvents')
    {
      const messageHandler ={
        name:'getUserEvents',
        handle:(message)=>{
          if(message.type === 'filter')
          {
            registerMessageHandle(false,messageHandler);

            if(callbackAfterGetRes)
            {
              callbackAfterGetRes(message);
            }
          }
        }
      }
      registerMessageHandle(true,messageHandler);
      send({type:'filter',userId:userInfo?.id});
    }
    } catch (e) {
      console.error('Error in orderToServer:', e);
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

  useEffect(() => {
    console.log('userInfo changed:', userInfo);
  }, [userInfo]);

  interface AuthenticationMessage {
    type: 'verifyToken';
    success: boolean;
    userId: number;
    userinfo: UserInfo;  // Note: it's 'userinfo' not 'userInfo'
    userEvents: any[];
    kidEvents: any[];
  }
  const checkAuthenticationMessage = (message: any): AuthenticationMessage | null => {
    if (message.type !== 'verifyToken') {
      console.warn('Unexpected message type for authentication:', message.type);
      return null;
    }

    if (typeof message.success !== 'boolean') {
      console.warn('Authentication message missing success field or not boolean');
      return null;
    }

    if (message.success === false) {
      console.log('Token verification failed');
      setLoginState({ logined: false, error: 'Token verification failed' });
      setToken(null);
      setUserInfo(null);
      setUserEvents([]);
      setKidEvents([]);
      return null;
    }

    if (!Number.isInteger(message.userId)) {
      console.warn('Authentication message missing userId or not an integer');
      return null;
    }

    if (typeof message.userinfo !== 'object' || message.userinfo === null) {
      console.warn('Authentication message missing userinfo or not an object');
      return null;
    }

    const { email, username, id, kidinfo } = message.userinfo;

    if (typeof email !== 'string' || typeof username !== 'string' || !Number.isInteger(id)) {
      console.warn('Authentication userinfo has invalid or missing fields');
      return null;
    }

    if (!Array.isArray(kidinfo)) {
      console.warn('Authentication userinfo kidinfo is not an array');
      return null;
    }

    if (!Array.isArray(message.userEvents) || !Array.isArray(message.kidEvents)) {
      console.warn('Authentication message missing userEvents or kidEvents or they are not arrays');
      return null;
    }

    return message as AuthenticationMessage;
  };

  useEffect(()=>{
    messageHandlers.forEach((handler)=>{
       console.log(handler.name);
       handler.handle(messageFromserver);
    })
  },[messageFromserver]);


  function handleMessages(event) {
    const message = JSON.parse(event.data);
    setMessageFromServer(message);

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
    else if (message.type === 'verifyToken') {
      console.log('Authentication message received:', message);
      const data = checkAuthenticationMessage(message);
      if (data && data.success) {
        console.log("Token verified successfully, userId:", data.userId);
        setLoginState({ logined: true, error: '' });
        setUserInfo(data.userinfo);
        setUserEvents(data.userEvents);

        // 修改这里的处理逻辑
        const kidEvents = (data.kidEvents || [])
          .flat(2) // 展平嵌套数组，深度为2
          .filter(event => event && event.userId !== data.userinfo.id);
        console.log("Filtered kidEvents:", kidEvents);
        setKidEvents(kidEvents);

        // 在验证成功后，主动获取前10个匹配活动
        if (data.userEvents && data.userEvents.length > 0) {
          data.userEvents.forEach(event => {
            send({ type: 'getMatch', eventId: event.id, start: 0, end: 10 });
          });
        }
      } else {
        console.log("Token verification failed");
        setLoginState({ logined: false, error: 'Token verification failed' });
        setToken(null);
        setUserInfo(null);
        setUserEvents([]);
        setKidEvents([]);
      }
    }
    else if (message.type === 'addkidinfo') {
      if (message.success) {
        console.log("Kid info added successfully, kidId:", message.kidId);
        setUserInfo(message.userinfo);
        // You might want to trigger some UI update or notification here
      } else {
        console.log("Failed to add kid info");
        // Handle the error case if needed
      }
    }
    else if (message.type === 'logout') {
      if (message.success) {
        console.log("Logout successful:", message.message);
        setLoginState({ logined: false, error: '' });
        setUserInfo(null);
        setToken(null);
        SecureStore.deleteItemAsync('userToken');  // Clear the stored token
      } else {
        console.log("Logout failed:", message.message);
        // Optionally handle failed logout
      }
    }
    else if (message.type === 'filter') {
      if (message.success) {
        setEvents(message.events); // This will set events to an empty array if message.events is empty
      } else {
        console.error('Filter request failed:', message.message);
        setEvents([]); // Clear events on failure as well
      }
    }
    else if (message.type === 'userEvents') {
      console.log("Received userEvents message:", message);
      setUserEvents(message.userEvents || []);
      setKidEvents((message.kidEvents || []).filter(event => event.userId !== userInfo?.id));
    }
    else if (message.type === 'getMatch') {
      console.log("Start to handle getMatch message");
      if (message.success && Array.isArray(message.matches)) {
        if (message.matches.length > 0) {
          setMatchedEvents(prev => {
            const updatedMatches = message.matches.map(match => ({
              score: match.score,
              event: match.event
            }));
            
            const existingMatches = prev[message.eventId] || [];
            
            // 合并现有匹配和新匹配，优先使用新匹配的信息
            const mergedMatches = [...existingMatches];
            updatedMatches.forEach(newMatch => {
              const existingIndex = mergedMatches.findIndex(m => m.event.id === newMatch.event.id);
              if (existingIndex !== -1) {
                // 更新现有匹配
                mergedMatches[existingIndex] = newMatch;
              } else {
                // 添加新匹配
                mergedMatches.push(newMatch);
              }
            });

            const updatedMatchedEvents = {
              ...prev,
              [message.sourceEventId]: mergedMatches
            };
            
            console.log(`Updated matchedEvents for eventId ${message.sourceEventId}:`, updatedMatchedEvents);
            return updatedMatchedEvents;
          });
        } else {
          console.log(`No matches found for eventId ${message.sourceEventId}`);
        }
      } else {
        console.error('getMatch request failed or invalid data:', message);
        console.log('message.eventId:', message.eventId);
        console.log('message.matches:', message.matches);
      }
    }
  }
  const registerMessageHandle = (on: boolean, handler: MessageHandler) => {
    if (on) {
      setMessageHandlers(prevHandlers => {
        if (!prevHandlers.some(h => h.name === handler.name)) {
          const newHandlers = [...prevHandlers, handler];
          console.log('Updated message handlers:', newHandlers);
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

  const getMatchEvents = (eventId: number) => {
    const result = matchedEvents[eventId] || [];
    // console.log("getMatchEvents",result);
    return result;
  };

  const isEventBelongToUser=(event)=>{
      return event.userId === userInfo?.id;
  };

  const isParticipateEvent = (event) => {
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
        send({ type: 'verifyToken', token: token });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [ws, token]);
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