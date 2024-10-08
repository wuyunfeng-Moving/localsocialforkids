import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, UserInfo, Events, AuthenticationMessage, MessageFromServer, MatchEvents,MatchEvent } from '../types/types';
import * as SecureStore from 'expo-secure-store';

const serverData = (() => {

    const [notifications, setNotifications] = useState<Array<{ type: string; message: string,read:boolean } | null>>([]);
    const [userEvents, setUserEvents] = useState<Events>([]);
    const [kidEvents, setKidEvents] = useState<Events>([]);
    const [matchedEvents, setMatchedEvents] = useState<MatchEvents>([]);
    const [loginState, setLoginState] = useState<{
        logined:boolean;
        error:'No token' | 'Token expired' | string;
    }>({
        logined: false,
        error: ''
    });
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const fetchTokenAndNotifications = async () => {
            const tempToken = await getToken();
            if (!tempToken) {
                setLoginState({ logined: false, error: 'No token' });
                clearLocalNotifications();
            } else {
                setToken(tempToken);
                const storedNotifications = await getLocalNotifications();
                console.log("storedNotifications",storedNotifications);
                setNotifications(storedNotifications);
            }
        }
        fetchTokenAndNotifications();
    }, []); // Add notifications as a dependency
    
    useEffect(()=>{
        console.log("current notifications:",notifications);

    },[notifications]);

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

        if (!Array.isArray(message.userEvents) || !Array.isArray(message.kidEvents)) {
            console.warn('Authentication message missing userEvents or kidEvents or they are not arrays');
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
                    if (message.message && typeof message.message === 'object') {
                        const newNotification = {
                            type: message.message.type,
                            message: message.message.message,
                            id: message.message.id,
                            eventId: message.message.eventId,
                            createdAt: message.message.createdAt,
                            read: message.message.read
                        };
                        setNotifications(prev => {
                            const newData = [...prev, newNotification];
                            storeLocalNotifications(newData);
                            console.log('New notifications:', newData);
                            return newData;
                        });
                    } else {
                        console.error('Invalid notification format:', message);
                    }
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
                        setUserInfo(message.userInfo);
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
                        setUserInfo(data.userinfo);
                        setUserEvents(data.userEvents);

                        const kidEvents = (data.kidEvents || [])
                            .flat(2)
                            .filter(event => event && event.userId !== data.userinfo.id);
                        setKidEvents(kidEvents);
                        
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
                        setUserInfo(null);
                        setUserEvents([]);
                        setKidEvents([]);
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
                            const flattenedKidEvents = kidEvents.flat(2).filter(event => event && event.userId !== userInfo?.id);
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

    const setAndStoreNotifications = async (newNotifications) => {
        console.log("test");
        console.log(notifications);
        console.log(newNotifications);
    
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
            storeLocalNotifications(newData);
            console.log('New notifications:', newData);
            return newData;
        });

        console.log("setover");
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

    return ({
        notifications,
        userEvents,
        kidEvents,
        matchedEvents,
        loginState,
        userInfo,
        token,
        setting:{
            setAndStoreNotifications,

        },
        messageHandle,
    });
});

export default serverData;



