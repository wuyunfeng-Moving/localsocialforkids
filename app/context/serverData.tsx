import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, UserInfo, Events, AuthenticationMessage, MessageFromServer, MatchEvents,MatchEvent,RecommendEvents} from '../types/types';
import * as SecureStore from 'expo-secure-store';
import { Notification } from '../types/notification_types';
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import axios from 'axios';


const SERVERIP = "121.196.198.126";
const PORT = 3000; // 更新为服务器实际使用的端口
const BASE_URL = `http://${SERVERIP}:${PORT}`;

/*
核心数据：
1.userInfo
2.kidInfo
3.

*/


const serverData = (() => {

    const queryClient = useQueryClient();

    const userDataQuery = useQuery({
        queryKey: ['userData'],
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error('no token');
            
            // console.log("Fetching user data")
            const response = await axios.get(`${BASE_URL}/userInfo`, {
                headers: {Authorization: `Bearer ${token}`}
            });
            if (response.data.success) {
                console.log("Fetching user data",response.data);
                return response.data;
            }
            throw new Error('Failed to fetch user data');
        }
    });

    useEffect(() => {
        if (userDataQuery.isSuccess) {
            setLoginState({ logined: true, error: '' });
        }
        if (userDataQuery.isError) {
            setLoginState({ logined: false, error: userDataQuery.error.message });
            setToken(null);
        }
    }, [userDataQuery.isSuccess, userDataQuery.isError, userDataQuery.error]);

    const [notifications, setNotifications] = useState<Array<Notification | null>>([]);
    // const userEvents = userInfoQuery.data.userEvents;
    const [kidEvents, setKidEvents] = useState<Events>([]);
    const [following,setFollowing] = useState<UserInfo[]>([
        {
            id: 1,
            username: 'Alice',
            email: '',
            introduction: '测试一下',
            kidinfo: [
                {
                    id: 1,
                    name: 'Alice\'s kid 1',
                    birthDate: '2021-01-01',
                    gender: 'male',
                    photoPath: '',
                    description: '',
                    personalSpaceUrl: '',
                    guardians: []
                }]
            }
    ]);
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
    const [token, setToken] = useState(null);

    useEffect(() => {
        const fetchTokenAndVerify = async () => {
            const tempToken = await getToken();
            if (tempToken) {
                // 验证 token
                try {
                    const response = await axios.post(`${BASE_URL}/verifyToken`, {}, {
                        headers: { Authorization: `Bearer ${tempToken}` }
                    });
                    if (response.data.success) {
                        setLoginState({ logined: true, error: '' });
                        queryClient.setQueryData(['userData'], response.data.userInfo);
                    } else {
                        throw new Error('Token verification failed');
                    }
                } catch (error) {
                    console.error('Token verification error:', error);
                    setLoginState({ logined: false, error: 'Token verification failed' });
                    setToken(null);
                    await SecureStore.deleteItemAsync('userToken');
                    queryClient.invalidateQueries(['userData']);
                    await clearLocalNotifications();
                }
            } else {
                setLoginState({ logined: false, error: 'No token' });
                clearLocalNotifications();
            }
        };

        fetchTokenAndVerify();
    }, []); // 仅在组件挂载时运行
    
    useEffect(()=>{
        console.log("current kidEvents:",kidEvents);

    },[kidEvents]);

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
            console.warn('Token verification failed');
            setLoginState({ logined: false, error: 'Token expired' });
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

        return message as AuthenticationMessage;
    };



    const messageHandle = async (message: MessageFromServer) => {
        console.log('Received message:', message);
        let syncData = null;
        
        switch (message.type) {
            case 'notification':
                {
                    console.log('Received notification message:', message);
                    setAndStoreNotifications(message.notification);
                }
                break;

            case 'getUserEvents':
                {
                    if (Array.isArray(message.userEvents)) {
                        setUserEvents(message.userEvents);
                    }
                    
                    if (Array.isArray(message.kidEvents) && message.kidEvents.length > 0) {
                        // Flatten the nested array and filter out events from the current user
                        const flattenedKidEvents = message.kidEvents.flat(2).filter(event => event && event.userId !== userInfo?.id);
                        setKidEvents(flattenedKidEvents);
                    } else {
                        setKidEvents([]);
                    }
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
            case 'login':
                {
                    if (message.success) {
                        storeToken(message.token);
                        setLoginState({ logined: true, error: '' });
                        // Update the userInfo query data instead of setting state
                        queryClient.setQueryData(['userInfo'], message.userInfo);
                    } else {
                        console.warn("Login failed:", message.message);
                        setLoginState({ logined: false, error: message.message });
                    }
                }
                break;

            case 'verifyToken':
                {
                    const data = checkAuthenticationMessage(message);
                    if (data && data.success) {
                        setLoginState({ logined: true, error: '' });
                        // Update the userInfo query data instead of setting state
                        queryClient.setQueryData(['userInfo'], data.userinfo);
                        
                        const storedNotifications = await getLocalNotifications();
                        // Prepare sync data after successful verification
                        syncData = {
                            type: 'appDataSyncToServer',
                            notification: {
                                id: storedNotifications.length > 0 ? storedNotifications[storedNotifications.length - 1].id : 0
                            }
                        };

                        console.log('syncData:', JSON.stringify(syncData, null, 2));
                    } else {
                        console.warn("Token verification failed");
                        setLoginState({ logined: false, error: 'Token verification failed' });
                        setToken(null);
                        // Invalidate the userInfo query
                        queryClient.invalidateQueries(['userInfo']);
                        await clearLocalNotifications();
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
            case 'logout':
                {
                    if (message.success) {
                        // console.log("Logout successful:", message.message);
                        setLoginState({ logined: false, error: '' });
                        setUserInfo(null);
                        setToken(null);
                        SecureStore.deleteItemAsync('userToken');
                        clearLocalNotifications();
                    } else {
                        console.warn("Logout failed:", message.message);
                        // Optionally handle failed logout
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
            case 'appDataSyncToClient':
                {
                    if (message.success && message.data) {
                        const { notifications: newNotifications, userInfo, userEvents, kidEvents } = message.data;

                        // Update notifications
                        if (Array.isArray(newNotifications)) {
                            const flattenedNotifications = newNotifications.flat();
                            setAndStoreNotifications(flattenedNotifications);
                        }

                        // Update user info
                        if (userInfo) {
                            setUserInfo(userInfo);
                        }

                        // Update user events
                        if (Array.isArray(userEvents)) {
                            setUserEvents(userEvents);
                        }
                               // Update kid events
            if (Array.isArray(kidEvents)) {
                const flattenedKidEvents = kidEvents.flat(Infinity);
                setKidEvents(flattenedKidEvents);
            }

                        console.log('App data synced successfully');
                    } else {
                        console.error('App data sync failed or invalid data:', message);
                    }
                }
                break;
        }

        // Return syncData if it's set
        return syncData;
    };

    const setAndStoreNotifications = async (newNotifications:Notification[]) => {
        console.log("Starting to update notifications");
    
        const updatedNotifications = await new Promise(resolve => {
            setNotifications(prev => {
                // Create a Map of existing notifications, using id as the key
                const existingNotificationsMap = new Map(
                    prev.map(notification => [notification.id, notification])
                );
    
                // Process new notifications
                newNotifications.forEach(newNotification => {
                    if (existingNotificationsMap.has(newNotification.id)) {
                        // If the notification already exists, update it
                        existingNotificationsMap.set(newNotification.id, {
                            ...existingNotificationsMap.get(newNotification.id),
                            ...newNotification
                        });
                    } else {
                        // If it's a new notification, add it
                        existingNotificationsMap.set(newNotification.id, newNotification);
                    }
                });
    
                // Convert the Map back to an array
                const newData = Array.from(existingNotificationsMap.values());
    
                // Store the updated notifications
                // storeLocalNotifications(newData);
                console.log('New notifications:', newData);
                resolve(newData);
                return newData;
            });
        });

        await storeLocalNotifications(updatedNotifications);
        console.log("Notifications update completed");
    };

    const storeLocalNotifications = async (notifications) => {
        console.log('Storing notifications:', notifications);
        try {
            await AsyncStorage.setItem('localNotifications', JSON.stringify(notifications));
        } catch (e) {
            console.error('Error saving notifications:', e);
        }
    };

    const getLocalNotifications = async () => {
        try {
            const storedNotifications = await AsyncStorage.getItem('localNotifications');
            console.log("Raw stored notifications:", storedNotifications);
            return storedNotifications ? JSON.parse(storedNotifications) : [];
        } catch (e) {
            console.error('Error reading notifications:', e);
            return [];
        }
    };

    const clearLocalNotifications = async () => {
        try {
            await AsyncStorage.removeItem('localNotifications');
            setNotifications([]);
        } catch (e) {
            console.error('Error clearing notifications:', e);
        }
    };

    const updateUserInfo = useMutation({
        mutationFn: async (newUserInfo: Partial<UserInfo>) => {
            const token = await getToken();
            if (!token) throw new Error('No token');

            const response = await axios.post(`${BASE_URL}/userInfo`, newUserInfo, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data;
        },
        onSuccess: (data) => {
            console.log("get response.data userInfo",data);
            queryClient.setQueryData(['userData'], data);
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
                clearLocalNotifications();
                
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

    return ({
        notifications,
        userEvents: userDataQuery.data?.userEvents || [],
        kidEvents: userDataQuery.data?.kidEvents || [],
        following,
        recommendEvents,
        matchedEvents,
        loginState,
        userInfo: userDataQuery.data?.userInfo,
        token,
        isLoading: userDataQuery.isLoading,
        isError: userDataQuery.isError,
        error: userDataQuery.error,
        setting:{
            setAndStoreNotifications,

        },
        messageHandle,
        updateUserInfo,
        login: loginMutation.mutate,
        logout: logoutMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,
    });
});

export default serverData;














