import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, UserInfo, Events, AuthenticationMessage, 
    MessageFromServer, MatchEvents,MatchEvent,RecommendEvents
    ,KidInfo,ChatMessage,ChatMessagesArray,LoginState,isUserInfo,isKidInfo,isEvent,isComment,isChatMessage,isUserDataResponse,
    isBaseResponse,isSearchEventsResponse,isChangeEventResponse,isNotificationResponse,isKidInfoResponse,
    WebSocketMessageFromServer,isWebSocketMessageFromServer,
    Notification,isNotification,
    UserDataResponse,
    LoginResponse,isLoginResponse,
    GetEventsResponse,isGetEventsResponse,
    BaseResponse
} from '../types/types';
import * as SecureStore from 'expo-secure-store';
import {useQuery,useMutation,useQueryClient, UseMutationResult} from "@tanstack/react-query";
import axios from 'axios';


const SERVERIP = "121.196.198.126";
const PORT = 3000;
const BASE_URL = `http://${SERVERIP}:${PORT}`;

// Add new API endpoints configuration
const API_ENDPOINTS = {
    userInfo: `${BASE_URL}/userInfo`,//getmyown info
    verifyToken: `${BASE_URL}/verifyToken`,
    login: `${BASE_URL}/login`,
    register: `${BASE_URL}/register`,
    logout: `${BASE_URL}/logout`,
    searchEvents: `${BASE_URL}/searchEvents`,
    changeEvent: `${BASE_URL}/changeEvent`,
    getKidInfo: (kidId: number) => `${BASE_URL}/getKidInfo/${kidId}`,
    getUserInfo: (userId: number) => `${BASE_URL}/getUserInfo/${userId}`,
    notifications: `${BASE_URL}/notifications`,
    chats: `${BASE_URL}/chats`,
    getChatHistory: (chatId: number) => `${BASE_URL}/chats/${chatId}`,
    sendMessage: (chatId: number) => `${BASE_URL}/chats/${chatId}`,
    getEvents: `${BASE_URL}/getEvents`,
};



/*
核心数据：
1.userInfo
2.kidInfo
3.*/

interface AllEvents {
    created: Event[],
    participating: Event[],
    applied: Event[]
};

interface ServerData {
    notifications: Notification[];
    userEvents: Event[];
    kidEvents: Event[];
    appliedEvents: Event[];
    recommendEvents: RecommendEvents;
    matchedEvents: MatchEvents;
    loginState: LoginState;
    userInfo: UserInfo | undefined;
    refreshUserData: () => void;
    token: string | null;
    isUserDataLoading: boolean;
    isError: boolean;
    error: Error | null;
    registerMutation: UseMutationResult<BaseResponse, Error, {
        username: string;
        email: string;
        password: string;
    }>;
    websocketMessageHandle: (message: MessageFromServer) => Promise<void>;
    updateUserInfo: UseMutationResult<BaseResponse, Error, {
        type: 'addKidInfo'|'deleteKidInfo'|'updateKidInfo'|'deleteEvent'|'addEvent';
        newUserInfo: any;
    }>;
    addkidinfo: (newKidInfo: Partial<KidInfo>, callback: (success: boolean, message: string) => void) => void;
    deletekidinfo: (kidId: number, callback: (success: boolean, message: string) => void) => void;
    login: (credentials: { email: string; password: string }) => void;
    logout: () => void;
    isLoggingIn: boolean;
    loginError: Error | null;
    searchEvents: {
        search: (searchParams: {
            keyword?: string;
            startDate?: string;
            endDate?: string;
            location?: [number, number];
            radius?: number;
            eventId?: number;
            callback?: (success: boolean, message: string, events: Event[]) => void;
        }) => Promise<void>;
        isSearching: boolean;
        searchError: Error | null;
        results: Event[];
    };
    changeEvent: {
        signupEvent: (params: {
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
            eventId: number;
            callback: (success: boolean, message: string) => void;
        }) => Promise<void>;
        addComment: (params: {
            eventId: number;
            comment: string;
            callback?: (success: boolean, message: string) => void;
        }) => Promise<void>;
    };
    getUserInfo: (userId: number, callback: (userInfo: UserInfo) => void) => Promise<UserInfo>;
    getKidInfo: (kidId: number, callback: (kidInfo: KidInfo) => void, forceUpdate: boolean) => Promise<void>;
    followActions: {
        followUser: (params: {
            userId: number;
            callback: (success: boolean, message: string) => void;
        }) => Promise<void>;
        unfollowUser: (params: {
            userId: number;
            callback: (success: boolean, message: string) => void;
        }) => Promise<void>;
    };
    chat: {
        chatMessages: ChatMessagesArray;
        createChat: (params: {
            eventId: number;
            callback: (success: boolean, message: string, chatId: number) => void;
        }) => Promise<void>;
        getChatHistory: (chatId: number, callback: (success: boolean, messages: ChatMessage[]) => void) => Promise<void>;
        sendMessage: (params: {
            chatId: number;
            message: string;
            callback: (success: boolean, message: string) => void;
        }) => Promise<void>;
    };
    setNotificationsRead: (notificationId: number, callback: (success: boolean, message: string) => void) => Promise<void>;
    getEventsById: (eventIds: number[], callback: (events: Event[]) => void) => Promise<void>;
    
}




// Custom hook to add delayed loading state
function useDelayedQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  delayMs: number = 2000
) {
  const query = useQuery<TData>({ queryKey, queryFn });
  const [delayedLoading, setDelayedLoading] = useState(true);

  useEffect(() => {
    if (query.isLoading) {
      setDelayedLoading(true);
    } else {
      const timer = setTimeout(() => setDelayedLoading(false), delayMs);
      return () => clearTimeout(timer);
    }
  }, [query.isLoading, delayMs]);

  return {
    ...query,
    isLoading: delayedLoading,
  };
}

// Inside useServerData, add these modified functions:
const useServerData = (): ServerData => {
    const queryClient = useQueryClient();

    useEffect(()=>{
        queryClient.setQueryData<Event[]>(['Events'], []);
        queryClient.setQueryData<{id:number,userInfo:UserInfo}[]>(['userInfos'], []);
        queryClient.setQueryData<{id:number,kidInfo:KidInfo}[]>(['kidInfos'], []);
        queryClient.setQueryData<Notification[]>(['notifications'], []);
    },[]);

    const updateCacheUserInfo = (userInfo: UserInfo) => {
        queryClient.setQueryData<{id:number,userInfo:UserInfo}[]>(['userInfos'], (prev) => {
            if (!prev) return [{id:userInfo.id,userInfo}];
            return [...prev, {id:userInfo.id,userInfo}];
        });
    }

    const updateCacheKidInfo = (kidInfo: KidInfo) => {
        queryClient.setQueryData<{id:number,kidInfo:KidInfo}[]>(['kidInfos'], (prev) => {
            if (!prev) return [{id:kidInfo.id,kidInfo}];
            return [...prev, {id:kidInfo.id,kidInfo}];
        });
    }

    const updateCacheNotifications = (notifications: Notification[]) => {
        queryClient.setQueryData<Notification[]>(['notifications'], notifications);
    }


    const updateCacheEvents = (events: Event[]): Event[] => {
        console.log("Updating cache events:", events);
        const existingEvents = queryClient.getQueryData<Event[]>(['Events']) || [];
        console.log("Existing events:", existingEvents);
        
        const updatedEvents = [...existingEvents];
        
        events.forEach(newEvent => {
            const index = updatedEvents.findIndex(e => e.id === newEvent.id);
            if (index !== -1) {
                updatedEvents[index] = newEvent;
            } else {
                updatedEvents.push(newEvent);
            }
        });
        
        queryClient.setQueryData(['Events'], updatedEvents);
        return updatedEvents;
    }

    const getEventsById = async (eventIds: number[], callback: (events: Event[]) => void) => {
        // First check local cache
        const events = queryClient.getQueryData<Event[]>(['Events']) || [];
        const foundEvents = events.filter(event => eventIds.includes(event.id));
        
        // If we found all requested events in cache, return them
        if (foundEvents.length === eventIds.length) {
            callback(foundEvents);
            return;
        }
        
        // If some events are missing, fetch from server
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');
            
            const response = await axios.post(`${BASE_URL}/getEvents`, {
                eventIds: eventIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!isGetEventsResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch events');
            }

            const newEvents = response.data.events || [];
            
            const updatedEvents = updateCacheEvents(newEvents);
            // Return requested events
            const finalEvents = updatedEvents.filter(event => eventIds.includes(event.id));
            callback(finalEvents);
            
        } catch (error) {
            console.error('Error fetching events:', error);
            callback([]);
        }
    };

    const userDataQuery = useDelayedQuery(['userData'], async () => {
        console.log('Starting userDataQuery execution');
        const token = await getToken();
        console.log('Token retrieved:', token ? 'exists' : 'null');
        
        if (!token) throw new Error('no token');
        
        try {
            console.log('Making API request to userInfo endpoint');
            const response = await axios.get(API_ENDPOINTS.userInfo, {
                headers: {Authorization: `Bearer ${token}`}
            });
            
            console.log('API response received:', response.data);
            
            if (!isUserDataResponse(response.data)) {
                console.error('Invalid response format:', response.data);
                throw new Error('Invalid response format from server');
            }
            
            if (response.data.success) {
                console.log("userDataQuery success", response.data.userAllEvents);
                updateCacheEvents(response.data.userAllEvents);
                updateCacheUserInfo(response.data.userInfo);
                response.data.userInfo.kidinfo.forEach(kidInfo => {
                    updateCacheKidInfo(kidInfo);
                });
                updateCacheNotifications(response.data.notifications);
                return response.data;
            }
            throw new Error('Failed to fetch user data');
        } catch (error) {
            console.error('userDataQuery error:', error);
            throw error;
        }
    }, 2000);  // 2000ms delay

    useEffect(() => {
        console.log('userDataQuery state changed:', {
            isSuccess: userDataQuery.isSuccess,
            isError: userDataQuery.isError,
            error: userDataQuery.error,
            data: userDataQuery.data
        });
        
        if (userDataQuery.isSuccess) {
            console.log('Setting login state to success');
            setLoginState({ logined: true, error: '' });
        }
        if (userDataQuery.isError) {
            console.log('Setting login state to error');
            setLoginState({ logined: false, error: userDataQuery.error.message });
            setToken(null);
        }
    }, [userDataQuery.isSuccess, userDataQuery.isError, userDataQuery.error]);

    const [recommendEvents, setRecommendEvents] = useState<RecommendEvents>([
        {
            event: {
                id: 1,
                place: {
                    location: [0, 0],
                    maxNumber: 10
                },
                dateTime: '2021-01-01T12:00:00Z',
                duration: 60,
                topic: 'Event 1',
                description: 'Description 1',
                kidIds: [1],
                userId: 1,
                status: 'preparing'
            },
            reason: 'Reason 1'
        },
        {
            event: {
                id: 2,
                place: {
                    location: [0, 0],
                    maxNumber: 15
                },
                dateTime: '2021-01-02T13:00:00Z',
                duration: 90,
                topic: 'Event 2',
                description: 'Description 2',
                kidIds: [2],
                userId: 2,
                status: 'preparing'
            },
            reason: 'Reason 2'
        },
        {
            event: {
                id: 3,
                place: {
                    location: [0, 0],
                    maxNumber: 20
                },
                dateTime: '2021-01-03T14:00:00Z',
                duration: 120,
                topic: 'Event 3',
                description: 'Description 3',
                kidIds: [3],
                userId: 3,
                status: 'preparing'
            },
            reason: 'Reason 3'
        }
    ]);
    const [matchedEvents, setMatchedEvents] = useState<MatchEvents>([]);
    const [loginState, setLoginState] = useState<{
        logined:boolean;
        error:'No token' | 'Token expired' | string;
    }>({
        logined: false,
        error: ''
    });
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const fetchTokenAndVerify = async () => {
            const tempToken = await getToken();
            if (tempToken) {
                try {
                    const response = await axios.post(API_ENDPOINTS.verifyToken, {}, {
                        headers: { Authorization: `Bearer ${tempToken}` }
                    });
                    if (response.data.success) {
                        setToken(tempToken);

                        userDataQuery.refetch().then(()=>{
                            console.log("userDataQuery refetch success");
                            setLoginState({ logined: true, error: '' });
                        });
                    } else {
                        throw new Error('Token verification failed');
                    }
                } catch (error) {
                    console.error('Token verification error:', error);
                    await clearAllData();
                }
            } else {
                await clearAllData();
            }
        };

        fetchTokenAndVerify();
    }, []); // 仅在组件挂载时运行

    const storeToken = async (token:string) => {
        try {
            await SecureStore.setItemAsync('userToken', token);
            setToken(token); // Update state immediately after storing
        } catch (e) {
            console.error('Error saving token:', e);
        }
    };

    const getToken = async () => {
        try {
            return await SecureStore.getItemAsync('userToken');
        } catch (e) {
            console.error('Error reading token:', e);
            return null;
        }
    };

    const websocketMessageHandle = async (message: MessageFromServer) => {
        console.log('Received message:', message);
        
        // Type guard functions for each message type
        const isNewChatMessage = (msg: any): msg is { 
            type: 'newChat';
            chatId: number;
            messages: ChatMessage;
            success: boolean;
        } => {
            return msg.type === 'newChat' 
                && typeof msg.chatId === 'number'
                && typeof msg.success === 'boolean'
                && msg.messages !== undefined;
        };
        
        switch (message.type) {
            case 'newChat':
                {
                    if (!isNewChatMessage(message)) {
                        console.error('Invalid newChat message format:', message);
                        break;
                    }

                    console.log('Received new chat message:', message);
                    setChatMessages(prevMessages => {
                        const chatId = message.chatId;
                        const newMessage = message.messages;
                        
                        const chatIndex = prevMessages.findIndex(chat => chat.chatId === chatId);
                        
                        if (chatIndex !== -1) {
                            const updatedMessages = [...prevMessages];
                            updatedMessages[chatIndex] = {
                                chatId,
                                messages: [...updatedMessages[chatIndex].messages, newMessage]
                            };
                            return updatedMessages;
                        } else {
                            return [...prevMessages, { chatId, messages: [newMessage] }];
                        }
                    });
                }
                break;
            case 'token':
                break;
            default:
                console.warn('Unhandled message type:', message.type);
        }
    };

    const addkidinfo = (
        newKidInfo: Partial<KidInfo>,
        callback: (success: boolean, message: string) => void
    ) => {
        updateUserInfo.mutateAsync(
            {
                type: 'addKidInfo',
                newUserInfo: newKidInfo
            }
        ).then(() => {
            callback(true, "Kid info added successfully");
        }).catch((error) => {
            callback(false, error.message);
        });
    }

    const deletekidinfo = (
        kidId:number,
        callback:(success:boolean,message:string)=>void
    )=>{
        updateUserInfo.mutate(
            {
                type:'deleteKidInfo',
                newUserInfo:{id:kidId}
            },
            {
                onSuccess:()=>callback(true,"Kid info deleted successfully"),
                onError:(error)=>callback(false,error.message)
            }
        )
    }

    const updateUserInfo = useMutation({
        mutationFn: async ({
            type,
            newUserInfo
        }: {
            type: 'addKidInfo'|'deleteKidInfo'|'updateKidInfo'|'deleteEvent'|'addEvent';
            newUserInfo: any;  // Changed from Partial<UserInfo> since it could be different types
        }) => {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.userInfo, 
                {type,newUserInfo}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!isBaseResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            return response.data;
        },
        onSuccess: (data) => {
            // console.log("get response.data userInfo",data);
            userDataQuery.refetch();
            
            // Update caches when userInfo is updated
            // if (data.data.userInfo) {
            //     setUserInfoCache(prev => ({
            //         ...prev,
            //         [data.data.userInfo.id]: {
            //             userInfo: data.data.userInfo,
            //             kidEvents: data.data.kidEvents || [],
            //             userEvents: data.data.userEvents || [],
            //             timestamp: Date.now()
            //         }
            //     }));

            //     // Update kidInfo cache if kidEvents are present
            //     if (data.data.kidEvents) {
            //         data.data.kidEvents.forEach(kidEvent => {
            //             if (isKidInfo(kidEvent)) {
            //                 setKidInfoCache(prev => ({
            //                     ...prev,
            //                     [kidEvent.id]: {
            //                         kidInfo: kidEvent,
            //                         timestamp: Date.now()
            //                     }
            //                 }));
            //             }
            //         });
            //     }
            // }
        },
        onError: (error) => {
            console.error('Failed to update user info:', error);
            if (axios.isAxiosError(error)) {
                console.error('Error details:', error.response?.data);
            }
        }
    });

    

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            const response = await axios.post(API_ENDPOINTS.logout, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!isBaseResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            return response.data;
        },
        onSuccess: (data) => {
            if (data.success) {
                // Clear all data
                setLoginState({ logined: false, error: '' });
                setToken(null);
                SecureStore.deleteItemAsync('userToken');
                
                // Clear React Query cache
                queryClient.clear();
                
                // Reset other state variables
                setFollowing([]);
                setRecommendEvents([]);
                setMatchedEvents([]);
                
                console.log('Logged out successfully and cleared all data');
            } else {
                console.warn('Logout was not successful:', data.message);
            }
        },
        onError: (error) => {
            console.error('Logout error:', error);
        }
    });

    const loginMutation = useMutation<LoginResponse,Error, { email: string; password: string }>({
        mutationFn: async (credentials: { email: string; password: string }) => {
            const response = await axios.post(API_ENDPOINTS.login, credentials);

            console.log("login response",response.data);
            if (!isLoginResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            return response.data;
        },
        onSuccess: async (data) => {
            if (data.success) {
                console.log("login success",data.token);
                await storeToken(data.token);
                userDataQuery.refetch().then(()=>{
                    console.log("userDataQuery refetch success");
                    setLoginState({ logined: true, error: '' });
                });
            } else {
                console.warn("Login failed:", data.message);
                setLoginState({ logined: false, error: data.message });
            }
        },
        onError: (error) => {
            console.error('Login error:', error);
            setLoginState({ logined: false, error: 'An error occurred during login' });
        }
    });

    const clearAllData = async () => {
        setLoginState({ logined: false, error: 'Token verification failed' });
        setToken(null);
        await SecureStore.deleteItemAsync('userToken');
        queryClient.clear();
        setFollowing([]);
        setRecommendEvents([]);
        setMatchedEvents([]);
        console.log('Cleared all data due to token verification failure');
    };

    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<Error | null>(null);

    // 更新搜索事件函数
    const searchEvents = async (searchParams: {
        keyword?: string;
        startDate?: string;
        endDate?: string;
        location?: [number, number];
        radius?: number;
        eventId?: number;
        callback?: (success: boolean, message: string, events: Event[]) => void;
    }) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.searchEvents, searchParams, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!isSearchEventsResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            if (response.data.success) {
                searchParams.callback?.(true, "", response.data.events || []);
            } else {
                searchParams.callback?.(false, response.data.message || "", []);
            }
        } catch (error) {
            console.error('Failed to search events:', error);
            searchParams.callback?.(false, error instanceof Error ? error.message : "Unknown error", []);
            setSearchError(error instanceof Error ? error : new Error('An unknown error occurred'));
        } finally {
            setIsSearching(false);
        }
    };

    // 更新事件相关函数
    const signupEvent = async (signEventParams: {
        targetEventId: number,
        sourceEventId?: number,
        kidsId?: number[],
        reason: string,
        callback: (success: boolean, message: string) => void,
    }) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.changeEvent, {
                targetEventId: signEventParams.targetEventId,
                sourceEventId: signEventParams.sourceEventId,
                kidsId: signEventParams.kidsId,
                reason: signEventParams.reason,
                type: 'signupEvent'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!isChangeEventResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            if (response.data.success) {
                userDataQuery.refetch();
                // signEventParams.callback(true, "Successfully signed up for the event");
            } else {
                signEventParams.callback(false, response.data.message || "Failed to sign up for the event");
            }
        } catch (error) {
            console.error('Error signing up for event:', error);
            let errorMessage = "An error occurred while signing up for the event";
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            signEventParams.callback(false, errorMessage);
        }
    };

    // 更新获取Kid信息函数
    const getKidInfo = async (
        kidId: number,
        callback: (kidInfo: KidInfo) => void,
        forceUpdate: boolean = false
    ): Promise<void> => {
        const cachedData = queryClient.getQueryData<{id:number,kidInfo:KidInfo}[]>(['kidInfos'])?.find(item => item.id === kidId);
        if (!forceUpdate && cachedData) {
            callback(cachedData.kidInfo);
            return;
        }

        const token = await getToken();
        if (!token) throw new Error('No token');

        const response = await axios.get(API_ENDPOINTS.getKidInfo(kidId), {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!isKidInfoResponse(response.data)) {
            throw new Error('Invalid response format from server');
        }

        if (response.data.success && response.data.kidInfo) {
            updateCacheKidInfo(response.data.kidInfo);

            callback(response.data.kidInfo);
            return;
        }
        throw new Error(response.data.message || 'Failed to fetch kid info');
    };

    // 更新通知相关函数
    const setNotificationsRead = async (notificationId: number, callback: (success: boolean, message: string) => void) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.notifications, {
                notificationId,
                type: 'setNotificationsRead'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!isNotificationResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            if (response.data.success) {
                userDataQuery.refetch();
                callback(true, "Notifications marked as read");
            } else {
                callback(false, response.data.message || "Failed to mark notifications as read");
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            let errorMessage = "An error occurred while marking notifications as read";
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            callback(false, errorMessage);
        }
    };

    // Add this new query function
    const getUserInfo = async (
        userId: number,
        callback: (userInfo: UserInfo) => void,
        forceUpdate: boolean = false
    ): Promise<UserInfo> => {
        // Check cache first
        const cachedData = queryClient.getQueryData<{id:number,userInfo:UserInfo,kidEvents:Event[],userEvents:Event[]}>(['userInfos'])?.find(item => item.id === userId);
        if (!forceUpdate && cachedData) {
            callback(cachedData.userInfo);
            return cachedData.userInfo;
        }

        // If not in cache or force update, fetch from server
        const token = await getToken();
        if (!token) throw new Error('No token');

        const response = await axios.get(API_ENDPOINTS.getUserInfo(userId), {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!isUserDataResponse(response.data)) {
            console.log("getUserInfo response.data",response.data);
            throw new Error('Invalid response format from server');
        }

        if (response.data.success) {
            updateCacheUserInfo(response.data.userInfo);
            callback(response.data.userInfo);
            return response.data.userInfo;
        }
        throw new Error(response.data.message || 'Failed to fetch user info');
    };

    // Add following state near other state declarations
    const [following, setFollowing] = useState<number[]>([]);

    // Add this state near other state declarations
    const [chatMessages, setChatMessages] = useState<ChatMessagesArray>([]);

    // Add these new functions inside serverData
    const followUser = async (params: {
        userId: number,
        callback: (success: boolean, message: string) => void
    }) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.userInfo, {
                targetUserId: params.userId,
                type: 'follow'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setFollowing(prev => [...prev, params.userId]);
                userDataQuery.refetch();
                params.callback(true, "Successfully followed user");
            } else {
                params.callback(false, response.data.message || "Failed to follow user");
            }
        } catch (error) {
            console.error('Error following user:', error);
            let errorMessage = "An error occurred while following the user";
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            params.callback(false, errorMessage);
        }
    };

    const unfollowUser = async (params: {
        userId: number,
        callback: (success: boolean, message: string) => void
    }) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.userInfo, {
                targetUserId: params.userId,
                type: 'unfollow'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setFollowing(prev => prev.filter(id => id !== params.userId));
                userDataQuery.refetch();
                params.callback(true, "Successfully unfollowed user");
            } else {
                params.callback(false, response.data.message || "Failed to unfollow user");
            }
        } catch (error) {
            console.error('Error unfollowing user:', error);
            let errorMessage = "An error occurred while unfollowing the user";
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            params.callback(false, errorMessage);
        }
    };

    const addComment = async (params: {
        eventId: number,
        comment: string,
        callback?: (success: boolean, message: string) => void
    }) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.changeEvent, {
                eventId: params.eventId,
                comment: params.comment,
                type: 'addComment'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                userDataQuery.refetch();
                params.callback?.(true, "Successfully added comment");
            } else {
                console.warn("Failed to add comment:", response.data.message);
                params.callback?.(false, response.data.message || "Failed to add comment");
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            let errorMessage = "An error occurred while adding the comment";
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            params.callback?.(false, errorMessage);
        }
    };

    const createChat = async (params: {
        eventId: number,
        callback: (success: boolean, message: string,chatId:number) => void
    }) => {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const response = await axios.post(API_ENDPOINTS.chats, {
            eventId: params.eventId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("res createChat",response.data);

        if (response.data.success) {
            params.callback(true, "Chat created successfully",response.data.chatId);
        } else {
            params.callback(false, response.data.message || "Failed to create chat",-1);
        }
    }

    const getChatHistory = async (chatId: number, callback: (success: boolean, messages: ChatMessage[]) => void) => {
        const token = await getToken();
        if (!token) throw new Error('No token');

        console.log("getChatHistory",chatId);

        const response = await axios.get(API_ENDPOINTS.getChatHistory(chatId), {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!isChatHistoryResponse(response.data)) {
            throw new Error('Invalid response format from server');
        }

        if (response.data.success) {
            // Update only the specific chat's messages
            setChatMessages(prevMessages => {
                const chatIndex = prevMessages.findIndex(chat => chat.chatId === chatId);
                if (chatIndex !== -1) {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[chatIndex] = {
                        chatId,
                        messages: response.data.messages
                    };
                    return updatedMessages;
                }
                return [...prevMessages, { chatId, messages: response.data.messages }];
            });
            callback(true,response.data.messages);
        } else {
            callback(false,[]);
        }
    }

    const sendMessage = async (params: {
        chatId: number,
        message: string,
        callback: (success: boolean, message: string) => void
    }) => {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const response = await axios.post(API_ENDPOINTS.sendMessage(params.chatId), {
            content: params.message
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!isBaseResponse(response.data)) {
            throw new Error('Invalid response format from server');
        }

        if (response.data.success) {
            params.callback(true, "Message sent successfully");
        } else {
            params.callback(false, response.data.message || "Failed to send message");
        }
    }   

    const userAllEvents = useQueryClient().getQueryData(['categorizedEvents']) as AllEvents;

    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe(({ type, query }) => {
            if (query.queryKey[0] === 'Events' && query.state.status === 'success') {
                const events = query.state.data as Event[];
                if (!Array.isArray(events)) {
                    console.log("Events data is not an array:", events);
                    return;
                }

                // 修改这里，直接从userDataQuery.data获取userInfo
                const userInfo = userDataQuery.data?.userInfo;  // 移除.data层级
                if (!userInfo) {
                    console.log("No user info available:", userDataQuery.data);
                    return;
                }

                console.log("Processing events with userInfo:", {
                    userId: userInfo.id,
                    events: events
                });

                const userCreatedEvents = events.filter(event => event.userId === userInfo.id);
                const userKidsIds = userInfo.kidinfo.map(kid => kid.id) || [];
                const kidsParticipatingEvents = events.filter(event => 
                    event.kidIds?.some(kidId => userKidsIds.includes(kidId))
                );
                const userAppliedEvents = events.filter(event => 
                    event.pendingSignUps?.some(signup => signup.kidIds?.some(kidId => userKidsIds.includes(kidId)))
                );

                queryClient.setQueryData(['categorizedEvents'], {
                    created: userCreatedEvents,
                    participating: kidsParticipatingEvents,
                    applied: userAppliedEvents
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [queryClient, userDataQuery.data]);

    const registerMutation = useMutation({
        mutationFn: async (credentials: { username: string; email: string; password: string }) => {
            const response = await axios.post(API_ENDPOINTS.register, credentials);

            if (!isBaseResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            return response.data;
        },
    });

    return ({
        
        notifications: userDataQuery.data?.notifications ?? [],
        userEvents: userAllEvents?.created ?? [],
        kidEvents: userAllEvents?.participating ?? [],
        appliedEvents: userAllEvents?.applied ?? [],
        recommendEvents,
        matchedEvents,
        loginState,
        userInfo: userDataQuery.data?.userInfo && Object.keys(userDataQuery.data.userInfo).length > 0 
            ? userDataQuery.data.userInfo 
            : undefined,
        refreshUserData: userDataQuery.refetch,
        token,
        isUserDataLoading: userDataQuery.isLoading,
        isError: userDataQuery.isError,
        error: userDataQuery.error,
        websocketMessageHandle,
        updateUserInfo,
        addkidinfo,
        deletekidinfo,
        login: loginMutation.mutate,
        logout: logoutMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,
        searchEvents: {
            search: searchEvents,
            isSearching,
            searchError
        },
        getEventsById,
        changeEvent: {
            signupEvent,
            addComment,
        },
        getUserInfo,  // Add this to the returned object
        getKidInfo,
        followActions: {
            followUser,
            unfollowUser
        },
        chat: {
            chatMessages,
            createChat,
            getChatHistory,
            sendMessage
        },
        setNotificationsRead,
        registerMutation,
    });
};

export { useServerData };



























