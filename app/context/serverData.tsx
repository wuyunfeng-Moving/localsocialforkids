import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, UserInfo, Events, AuthenticationMessage, 
    MessageFromServer, MatchEvents,MatchEvent,RecommendEvents
    ,KidInfo,ChatMessage,ChatMessagesArray,LoginState} from '../types/types';
import * as SecureStore from 'expo-secure-store';
import { Notification } from '../types/notification_types';
import {useQuery,useMutation,useQueryClient, UseMutationResult} from "@tanstack/react-query";
import axios from 'axios';


const SERVERIP = "121.196.198.126";
const PORT = 3000; // 更新为服务器实际使用的端口
const BASE_URL = `http://${SERVERIP}:${PORT}`;

/*
核心数据：
1.userInfo
2.kidInfo
3.*/



interface ServerData {
    notifications: Notification[];
    userEvents: Event[];
    kidEvents: KidInfo[];
    recommendEvents: RecommendEvents;
    matchedEvents: MatchEvents;
    loginState: LoginState;
    userInfo: UserInfo | undefined;
    refreshUserData: () => void;
    token: string | null;
    isUserDataLoading: boolean;
    isError: boolean;
    error: Error | null;
    websocketMessageHandle: (message: MessageFromServer) => Promise<void>;
    updateUserInfo: UseMutationResult;
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
    getUserInfo: (userId: number, callback: (userInfo: UserInfo, kidEvents: KidInfo[], userEvents: Event[]) => void) => Promise<UserInfo>;
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

// Change from a variable to a custom hook
const useInfoCache = () => {
    const [userInfoCache, setUserInfoCache] = useState<Record<number, {
        userInfo: UserInfo;
        kidEvents: KidInfo[];
        userEvents: Event[];
        timestamp: number;
    }>>({});
    
    const [kidInfoCache, setKidInfoCache] = useState<Record<number, {
        kidInfo: KidInfo;
        timestamp: number;
    }>>({});

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    const isCacheValid = useCallback((timestamp: number) => {
        return Date.now() - timestamp < CACHE_DURATION;
    }, []);

    return {
        userInfoCache,
        kidInfoCache,
        setUserInfoCache,
        setKidInfoCache,
        isCacheValid
    };
};

// Inside useServerData, add these modified functions:
const useServerData = (): ServerData => {
    const queryClient = useQueryClient();
    const { userInfoCache, kidInfoCache, setUserInfoCache, setKidInfoCache, isCacheValid } = useInfoCache();

    const userDataQuery = useDelayedQuery(['userData'], async () => {
        const token = await getToken();
        if (!token) throw new Error('no token');
        
        const response = await axios.get(`${BASE_URL}/userInfo`, {
            headers: {Authorization: `Bearer ${token}`}
        });
        if (response.data.success) {
            console.log("Fetching user data", response.data);
            return response.data;
        }
        throw new Error('Failed to fetch user data');
    }, 2000);  // 2000ms delay

    useEffect(() => {
        if (userDataQuery.isSuccess) {
            setLoginState({ logined: true, error: '' });
        }
        if (userDataQuery.isError) {
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
                    const response = await axios.post(`${BASE_URL}/verifyToken`, {}, {
                        headers: { Authorization: `Bearer ${tempToken}` }
                    });
                    if (response.data.success) {
                        setToken(tempToken);
                        setLoginState({ logined: true, error: '' });
                        queryClient.setQueryData(['userData'], response.data.userInfo);
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

    const storeToken = async (token) => {
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
        let syncData = null;
        
        switch (message.type) {
            case 'newChat':
                {
                    console.log('Received new chat message:', message);
                    setChatMessages(prevMessages => {
                        const chatId = message.chatId;
                        const newMessage = message.messages;
                        
                        // Find existing chat index
                        const chatIndex = prevMessages.findIndex(chat => chat.chatId === chatId);
                        
                        if (chatIndex !== -1) {
                            // Update existing chat by appending the new message
                            const updatedMessages = [...prevMessages];
                            updatedMessages[chatIndex] = {
                                chatId,
                                messages: [...updatedMessages[chatIndex].messages, newMessage]
                            };
                            return updatedMessages;
                        } else {
                            // Add new chat with single message
                            return [...prevMessages, { chatId, messages: [newMessage] }];
                        }
                    });
                }
                break;
            case 'getMatch':
                {
                    try {
                        if (message.success && Array.isArray(message.matches)) {
                            const sourceEventId = message.sourceEventId;
                            const newMatchEvents: MatchEvent[] = message.matches.map(match => ({
                                // sourceEventId,
                                event: match.event as Event,
                                score: match.score
                            }));

                            console.log(newMatchEvents)

                            setMatchedEvents(prev => {
                                const updatedMatchedEvents = { ...prev };
                                if (sourceEventId in updatedMatchedEvents) {
                                    // If sourceEventId exists, update or add new events
                                    updatedMatchedEvents[sourceEventId] = updatedMatchedEvents[sourceEventId].map(existingMatch => {
                                        const newMatch = newMatchEvents.find(m => m.event.id === existingMatch.event.id);
                                        return newMatch || existingMatch;
                                    });
                                    // Add new events that don't exist in the current array
                                    newMatchEvents.forEach(newMatch => {
                                        if (!updatedMatchedEvents[sourceEventId].some(m => m.event.id === newMatch.event.id)) {
                                            updatedMatchedEvents[sourceEventId].push(newMatch);
                                        }
                                    });
                                } else {
                                    // If sourceEventId doesn't exist, add the new matches
                                    updatedMatchedEvents[sourceEventId] = newMatchEvents;
                                }
                                return updatedMatchedEvents;
                            });
                        } else {
                            console.error('getMatch request failed or invalid data:', message);
                        }
                    } catch (error) {
                        console.error('Error handling getMatch message:', error);
                    }
                }
                break;
            case 'addkidinfo':
                {
                    if (message.success) {
                        // console.log("Kid info added successfully, kidId:", message.kidId);
                        setUserInfo(message.userinfo);
                        // You might want to trigger some UI update or notification here
                    } else {
                        console.warn("Failed to add kid info");
                        // Handle the error case if needed
                    }
                }
                break;
            case 'filter':
                {
                    if (message.success) {
                        // setEvents(message.events); // This will set events to an empty array if message.events is empty
                    } else {
                        console.error('Filter request failed:', message.message);
                        // setEvents([]); // Clear events on failure as well
                    }
                }
                break;
        }

        // Return syncData if it's set
        return syncData;
    };

    const addkidinfo = (
        newKidInfo: Partial<KidInfo>,
        callback: (success: boolean, message: string) => void
    ) => {
        updateUserInfo.mutate(
            {
                type: 'addKidInfo',
                newUserInfo: newKidInfo
            },
            {
                onSuccess: () => callback(true, "Kid info added successfully"),
                onError: (error) => callback(false, error.message)
            }
        );
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

            const response = await axios.post(`${BASE_URL}/userInfo`, 
                {type,newUserInfo}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data;
        },
        onSuccess: (data) => {
            // console.log("get response.data userInfo",data);
            queryClient.setQueryData(['userData'], data);
            
            // Update caches when userInfo is updated
            if (data.userInfo) {
                setUserInfoCache(prev => ({
                    ...prev,
                    [data.userInfo.id]: {
                        userInfo: data.userInfo,
                        kidEvents: data.kidEvents || [],
                        userEvents: data.userEvents || [],
                        timestamp: Date.now()
                    }
                }));

                // Update kidInfo cache if kidEvents are present
                if (data.kidEvents) {
                    data.kidEvents.forEach(kidInfo => {
                        setKidInfoCache(prev => ({
                            ...prev,
                            [kidInfo.id]: {
                                kidInfo,
                                timestamp: Date.now()
                            }
                        }));
                    });
                }
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
            const response = await axios.post(`${BASE_URL}/logout`,{
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("response.data out",response.data);
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

    const loginMutation = useMutation({
        mutationFn: async (credentials: { email: string; password: string }) => {
            const response = await axios.post(`${BASE_URL}/login`, credentials);
            console.log(response.data);
            return response.data;
        },
        onSuccess: (data) => {
            if (data.success) {
                storeToken(data.token);
                setLoginState({ logined: true, error: '' });
                queryClient.setQueryData(['userData'], data.userData);
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

    const [searchResults, setSearchResults] = useState<Event[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<Error | null>(null);

    const searchEvents = async (searchParams: {
        keyword?: string;
        startDate?: string;
        endDate?: string;
        location?: [number, number];  // [latitude, longitude]
        radius?: number;  // in kilometers
        eventId?:number;
        callback?: (success:boolean,message:string,events: Event[]) => void;
    }) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(`${BASE_URL}/searchEvents`, searchParams, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if(response.data.success){
                console.log("Search results:", response.data.events);
                setSearchResults(response.data.events);
                searchParams.callback?.(true,"",response.data.events);
            }
            else{
                searchParams.callback?.(false,response.data.message,[]);
            }
        } catch (error) {
            console.error('Failed to search events:', error);
            searchParams.callback?.(false,"",[]);
            setSearchError(error instanceof Error ? error : new Error('An unknown error occurred'));
        } finally {
            setIsSearching(false);
        }
    };

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

            const response = await axios.post(`${BASE_URL}/changeEvent`, {
                targetEventId: signEventParams.targetEventId,
                sourceEventId: signEventParams.sourceEventId,
                kidsId: signEventParams.kidsId,
                reason: signEventParams.reason,
                type:'signupEvent'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                console.log("Event signup successful:", response.data);
                // Update local state if necessary
                // For example, you might want to update userEvents or kidEvents
                queryClient.invalidateQueries(['userData']);
                signEventParams.callback(true, "Successfully signed up for the event");
            } else {
                console.warn("Event signup failed:", response.data.message);
                signEventParams.callback(false, response.data.message || "Failed to sign up for the event");
            }
        } catch (error) {
            console.error('Error signing up for event:', error);
            let errorMessage = "An error occurred while signing up for the event";
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            signEventParams.callback(false, errorMessage);
        }
    };

    const approveSignupRequest = async (params: {
        eventId: number,
        signupId: number,
        approved: boolean,
        rejectionReason?: string,
        callback: (success: boolean, message: string) => void
    }) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(`${BASE_URL}/changeEvent`, {
                eventId: params.eventId,
                signupId: params.signupId,
                approved: params.approved,
                type:'approveSignUp',
                rejectionReason: params.rejectionReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                console.log("Signup request processed successfully:", response.data);
                queryClient.invalidateQueries(['userData']);
                params.callback(true, params.approved ? "Signup request approved" : "Signup request rejected");
            } else {
                console.warn("Failed to process signup request:", response.data.message);
                params.callback(false, response.data.message || "Failed to process signup request");
            }
        } catch (error) {
            console.error('Error processing signup request:', error);
            let errorMessage = "An error occurred while processing the signup request";
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            params.callback(false, errorMessage);
        }
    };

    const deleteEvent = async (params: {
        eventId: number,
        callback: (success: boolean, message: string) => void
    }) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(`${BASE_URL}/changeEvent`, {
                eventId: params.eventId,
                type: 'deleteEvent'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                console.log("Event deleted successfully:", response.data);
                queryClient.invalidateQueries(['userData']);
                params.callback(true, "Successfully deleted the event");
            } else {
                console.warn("Failed to delete event:", response.data.message);
                params.callback(false, response.data.message || "Failed to delete the event");
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            let errorMessage = "An error occurred while deleting the event";
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            params.callback(false, errorMessage);
        }
    };

    // Add this new query function
    const getUserInfo = useCallback(async (
        userId: number,
        callback: (userInfo: UserInfo, kidEvents: KidInfo[], userEvents: Event[]) => void,
        forceUpdate: boolean = false
    ): Promise<UserInfo> => {
        // Check cache first
        const cachedData = userInfoCache[userId];
        if (!forceUpdate && cachedData && isCacheValid(cachedData.timestamp)) {
            callback(cachedData.userInfo, cachedData.kidEvents, cachedData.userEvents);
            return cachedData.userInfo;
        }

        // If not in cache or force update, fetch from server
        const token = await getToken();
        if (!token) throw new Error('No token');

        const response = await axios.get(`${BASE_URL}/getUserInfo/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            const { userInfo, kidEvents, userEvents } = response.data.data;
            
            // Update cache
            setUserInfoCache(prev => ({
                ...prev,
                [userId]: {
                    userInfo,
                    kidEvents,
                    userEvents,
                    timestamp: Date.now()
                }
            }));

            // Update kidInfo cache for each kid
            kidEvents.forEach(kidInfo => {
                setKidInfoCache(prev => ({
                    ...prev,
                    [kidInfo.id]: {
                        kidInfo,
                        timestamp: Date.now()
                    }
                }));
            });

            callback(userInfo, kidEvents, userEvents);
            return userInfo;
        }
        throw new Error(response.data.message || 'Failed to fetch user info');
    }, [userInfoCache, isCacheValid]);

    const getKidInfo = useCallback(async (
        kidId: number,
        callback: (kidInfo: KidInfo) => void,
        forceUpdate: boolean = false
    ): Promise<void> => {
        // Check cache first
        const cachedData = kidInfoCache[kidId];
        if (!forceUpdate && cachedData && isCacheValid(cachedData.timestamp)) {
            console.log("cachedData",cachedData);
            callback(cachedData.kidInfo);
        }

        // If not in cache or force update, fetch from server
        const token = await getToken();
        if (!token) throw new Error('No token');

        console.log("fetching kidInfo",kidId);
        const response = await axios.get(`${BASE_URL}/getKidInfo/${kidId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("response.data",response.data);
        if (response.data.success) {
            const kidInfo = response.data.kidInfo;
            
            // Update cache
            setKidInfoCache(prev => ({
                ...prev,
                [kidId]: {
                    kidInfo,
                    timestamp: Date.now()
                }
            }));

            callback(kidInfo);
        }
        throw new Error(response.data.message || 'Failed to fetch kid info');
    }, [kidInfoCache, isCacheValid]);

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

            const response = await axios.post(`${BASE_URL}/userInfo`, {
                targetUserId: params.userId,
                type: 'follow'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setFollowing(prev => [...prev, params.userId]);
                queryClient.invalidateQueries(['userData']);
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

            const response = await axios.post(`${BASE_URL}/userInfo`, {
                targetUserId: params.userId,
                type: 'unfollow'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setFollowing(prev => prev.filter(id => id !== params.userId));
                queryClient.invalidateQueries(['userData']);
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

            const response = await axios.post(`${BASE_URL}/changeEvent`, {
                eventId: params.eventId,
                comment: params.comment,
                type: 'addComment'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                console.log("Comment added successfully:", response.data);
                queryClient.invalidateQueries(['userData']);
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

        const response = await axios.post(`${BASE_URL}/chats`, {
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

        const response = await axios.get(`${BASE_URL}/chats/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

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

        const response = await axios.post(`${BASE_URL}/chats/${params.chatId}`, {
            content: params.message
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            params.callback(true, "Message sent successfully");
        } else {
            params.callback(false, response.data.message || "Failed to send message");
        }
    }   


    const setNotificationsRead = async (notificationId: number, callback: (success: boolean, message: string) => void) => {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const response = await axios.post(`${BASE_URL}/notifications`, {
            notificationId,
            type: 'setNotificationsRead'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            // Update local notifications by marking the specified notification as read
            queryClient.setQueryData(['userData'], (oldData: any) => ({
                ...oldData,
                notifications: oldData.notifications.map((notification: Notification) =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            }));
            callback(true, "Notifications marked as read");
        } else {
            callback(false, response.data.message || "Failed to mark notifications as read");
        }
    }

    return ({
        notifications: userDataQuery.data?.notifications || [],
        userEvents: userDataQuery.data?.userEvents || [],
        kidEvents: userDataQuery.data?.kidEvents || [],
        recommendEvents,
        matchedEvents,
        loginState,
        userInfo: userDataQuery.data?.userInfo,
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
            results: searchResults,
        },
        changeEvent: {
            signupEvent,
            approveSignupRequest,
            deleteEvent,  // Add the new function here
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
    });
};

export { useServerData };



























