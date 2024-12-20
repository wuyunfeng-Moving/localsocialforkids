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
    isGetEventResponse,
    BaseResponse,OtherUserInfoResponse,isOtherUserInfoResponse,
    ApproveSignupRequestMessage,
    isRegisterResponse,
    RegisterResponse,
    updateUserInfoType,
    isUpdateUserInfoType
} from '../types/types';
import * as SecureStore from 'expo-secure-store';
import {useQuery,useMutation,useQueryClient, UseMutationResult} from "@tanstack/react-query";
import axios from 'axios';


// // export const SERVERIP = "121.196.198.126";
export const SERVERIP = "192.168.1.4";
export const SERVERIP = "172.20.10.2";
// export const SERVERIP = "192.168.1.7";
export const PORT = 3000;
export const BASE_URL = `http://${SERVERIP}:${PORT}`;

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
    getEvent: (eventId: number) => `${BASE_URL}/getEvent/${eventId}`,
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
    setWebSocketConnected: (connected: boolean) => void;
    notifications: Notification[]; // 当前账号所有的通知
    userEvents: Event[]; // 当前账号所有的活动
    kidEvents: Event[]; //当前账号的孩子所参与的活动
    appliedEvents: Event[]; //当前账号所申请的活动
    recommendEvents: RecommendEvents; // 推荐的活动
    matchedEvents: MatchEvents; // 匹配的活动
    loginState: LoginState; // 登录状态
    userInfo: UserInfo | undefined; // 当前账号的信息
    refreshUserData: () => void; // 刷新当前账号的信息
    token: string | null; // 当前账号的token
    isUserDataLoading: boolean; // 当前账号的信息是否正在加载
    isError: boolean; // 当前账号的信息是否加载失败
    error: Error | null; // 当前账号的信息加载失败的原因
    registerMutation: UseMutationResult<RegisterResponse, Error, {
        username: string;
        email: string;
        password: string;
    }>;
    websocketMessageHandle: (message: WebSocketMessageFromServer) => Promise<void>; // 处理websocket消息
    updateUserInfo: UseMutationResult<BaseResponse, Error, {
        type: updateUserInfoType;
        newUserInfo: any;
    }>; // 更新当前账号的信息
    addkidinfo: (newKidInfo: Partial<KidInfo>, callback: (success: boolean, message: string) => void) => void; // 添加孩子信息
    deletekidinfo: (kidId: number, callback: (success: boolean, message: string) => void) => void; // 删除孩子信息
    login: (credentials: { email: string; password: string }) => void; // 登录
    logout: () => Promise<void>; // 登出
    isLoggingIn: boolean; // 是否正在登录
    loginError: Error | null; // 登录失败的原因
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
    getUserInfo: (userId: number, callback: (userInfo: UserInfo) => void) => Promise<UserInfo|undefined>;
    getKidInfo: (kidId: number, callback: (kidInfo: KidInfo) => void, forceUpdate: boolean) => Promise<void>;
    followActions: {
        followUser: (params: {
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
    getEventsById: (eventIds: number[], callback: (events: Event[] | undefined) => void) => Promise<void>;
    getEventById: (eventId: number, callback: (event: Event | undefined) => void) => Event | undefined;
    
}

// Inside useServerData, add these modified functions:
const useServerData = (): ServerData => {

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
    const [webSocketConnected,setWebSocketConnected] = useState(false);
    const [token, setToken] = useState<string | null>(null);
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

    const userDataQuery = useQuery<{userAllEvents:Event[],userInfo:UserInfo,notifications:Notification[],created:Event[],participating:Event[],applied:Event[]}>({
        queryKey: ['userData'],
        queryFn: async () => {
            console.log('Starting userDataQuery execution');
            const token = await getToken();
            console.log('Token retrieved:', token ? 'exists' : 'null');
            
            if (!token) throw new Error('no1 token');
            
            try {
                const response = await axios.get(API_ENDPOINTS.userInfo, {
                    headers: {Authorization: `Bearer ${token}`}
                });
                
                if (!isUserDataResponse(response.data)) {
                    console.error('Invalid response format:', response.data);
                    throw new Error('Invalid response format from server');
                }
                
                if (response.data.success) {
                    const {userAllEvents,userInfo,notifications} = response.data;
                    const {created,participating,applied} = analyzeEvents(userAllEvents,userInfo);
                    return {userAllEvents,userInfo,notifications,created,participating,applied};
                }
                throw new Error('Failed to fetch user data');
            } catch (error) {
                console.error('userDataQuery error:', error);
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 如果websocket连接成功，且用户信息加载成功，则设置登录状态为成功
    useEffect(()=>{
        if(webSocketConnected && userDataQuery.isSuccess){
            setLoginState({logined:true,error:''});
        }
        else{
            setLoginState({logined:false,error:''});
        }
    },[webSocketConnected,userDataQuery.isSuccess]);

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
            const token = await SecureStore.getItemAsync('userToken');
            // console.log('getToken called, current token:', token);
            return token;
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
                setWebSocketConnected(true);
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
            type: updateUserInfoType;
            newUserInfo: any;  // Changed from Partial<UserInfo> since it could be different types
        }) => {
            if(!isUpdateUserInfoType(type)){
                throw new Error('Invalid updateUserInfo type:'+type);
            }
            
            if(type === 'updateUserInfo'){
                if(!isUserInfo(newUserInfo)){
                    console.log("newUserInfo",newUserInfo);
                    throw new Error('Invalid user info format');
                }
            }
            else if(type === 'addNewEvent'){
                if(!isEvent(newUserInfo)){
                    console.log("newUserInfo",newUserInfo);
                    throw new Error('Invalid event format');
                }
            }


            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.userInfo, 
                {type,newUserInfo}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!isBaseResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            return type;
        },
        onSuccess: (data) => {
            if(data !== 'deleteUser'){
                userDataQuery.refetch();
            }
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
                });
            } else {
                console.warn("Login failed:", data.message);
            }
        },
        onError: (error) => {
            console.error('Login error:', error);
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
    const [searchResults, setSearchResults] = useState<Event[]>([]);

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
                setSearchResults(response.data.events || []);
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

    const approveSignupRequest = async (params: {
        eventId: number,
        signupId: number,
        approved: boolean,
        rejectionReason?: string,
        callback: (success: boolean, message: string) => void,
    }) => {
        try{
            const token = await getToken();
            if (!token) throw new Error('No token');

            const message: ApproveSignupRequestMessage = {
                eventId: params.eventId,
                signupId: params.signupId,
                approved: params.approved,
                rejectionReason: params.rejectionReason,
                type: 'approveSignupRequest'
            };

            const response = await axios.post(API_ENDPOINTS.changeEvent, message, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }catch(error){
            console.error('Error approving signup request:', error);
        }
    }

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

    const deleteEvent = async (params: {
        eventId: number,
        callback: (success: boolean, message: string) => void
    }) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(API_ENDPOINTS.changeEvent, {
                eventId: params.eventId,
                type: 'deleteEvent'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!isBaseResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            if (response.data.success) {
                userDataQuery.refetch();
                params.callback(true, "Event deleted successfully");
            } else {
                params.callback(false, response.data.message || "Failed to delete event");
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            params.callback(false, "An error occurred while deleting the event");
        }
    }

    // 更新获取Kid信息函数
    const getKidInfo = async (
        kidId: number,
        callback: (kidInfo: KidInfo) => void,
        forceUpdate: boolean = false
    ): Promise<void> => {
        try {
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
                console.error('Invalid response format:', response.data);
                throw new Error('Invalid response format from server');
            }
            // debugger;

            if (response.data.success && isKidInfo(response.data.kidInfo)) {
                updateCacheKidInfo(response.data.kidInfo);
                callback(response.data.kidInfo);
                return;
            }
            
            // Handle unsuccessful response
            console.warn('Failed to fetch kid info:', response.data.message);
            throw new Error(response.data.message || 'Failed to fetch kid info');
            
        } catch (error) {
            // Log the error for debugging
            console.error('Error in getKidInfo:', error);
            
            // If it's an axios error, we can get more specific error details
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message;
                throw new Error(`Failed to fetch kid info: ${message}`);
            }
            
            // Re-throw the error to be handled by the caller
            throw error;
        }
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
    ): Promise<UserInfo|undefined> => {
        const userinfoquery = useQuery({
            queryKey: ['userInfo', userId],
            queryFn: async () => {
                const token = await getToken();
                if (!token) throw new Error('No token');

                const response = await axios.get(API_ENDPOINTS.getUserInfo(userId), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("getUserInfo response...",response.data);

                if (!isOtherUserInfoResponse(response.data)) {
                    throw new Error('Invalid response format from server');
                }

                return response.data.userInfo;
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
        });

        return userinfoquery.data;
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

    const analyzeEvents = (allEvents:Event[],userInfo:UserInfo):{created:Event[],participating:Event[],applied:Event[]} => {
        const userCreatedEvents = allEvents.filter(event => event.userId === userInfo.id);
        const userKidsIds = userInfo.kidinfo.map(kid => kid.id) || [];
        const kidsParticipatingEvents = allEvents.filter(event => 
            event.kidIds?.some(kidId => userKidsIds.includes(kidId))
        );
        const userAppliedEvents = allEvents.filter(event => 
            event.pendingSignUps?.some(signup => signup.kidIds?.some(kidId => userKidsIds.includes(kidId)))
        );
        return {
            created: userCreatedEvents,
            participating: kidsParticipatingEvents,
            applied: userAppliedEvents
        };

    }

    const registerMutation = useMutation<RegisterResponse, Error, { username: string; email: string; password: string }>({
        mutationFn: async (credentials: { username: string; email: string; password: string }) => {
            const response = await axios.post(API_ENDPOINTS.register, credentials);

            if (!isRegisterResponse(response.data)) {
                throw new Error('Invalid response format from server');
            }

            if(response.data.success){
                return response.data;
            }else{
                throw new Error(response.data.message || "Failed to register");
            }
        },
    });

    const getEventById = async (eventId: number, callback: (event: Event | undefined) => void) => {
        // 首先检查缓存
        const cachedEvent = queryClient.getQueryData(['singleEvent', eventId]) as Event | undefined;
        if (cachedEvent) {
            callback(cachedEvent);
            return cachedEvent;
        }

        // 如果没有缓存，发起新请求
        queryClient.fetchQuery({
            queryKey: ['singleEvent', eventId],
            queryFn: async () => {
                try{
                    const token = await getToken();
                    if (!token) throw new Error('No token');

                    const response = await axios.get(API_ENDPOINTS.getEvent(eventId), {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (!isGetEventResponse(response.data)) {
                        throw new Error('Invalid response format from server');
                    }

                    const event = response.data.event;
                    callback(event);
                    return event;
                } catch (error) {
                    console.error('Error fetching event by ID:', error);
                    callback(undefined);
                    return undefined;
                }
            }
        });

        console.log("getEventById3",eventId);

        return undefined; // 初始返回 undefined，数据会通过 callback 返回
    };

    return ({
        setWebSocketConnected,
        notifications: userDataQuery.data?.notifications ?? [],
        userEvents: userDataQuery.data?.created ?? [],
        kidEvents: userDataQuery.data?.participating ?? [],
        appliedEvents: userDataQuery.data?.applied ?? [],
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
            searchError,
            results: searchResults
        },
        changeEvent: {
            signupEvent,
            addComment,
            approveSignupRequest,
            deleteEvent
        },
        getUserInfo,  // Add this to the returned object
        getKidInfo,
        followActions: {
            followUser
        },
        chat: {
            chatMessages,
            createChat,
            getChatHistory,
            sendMessage
        },
        setNotificationsRead,
        registerMutation,
        getEventById,
    });
};

export { useServerData };



























