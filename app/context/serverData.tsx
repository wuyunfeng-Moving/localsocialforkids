import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Event, UserInfo, Events, AuthenticationMessage, MessageFromServer, MatchEvents } from '../types/types';

const serverData = (() => {

    const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
    const [userEvents, setUserEvents] = useState<Events>([]);
    const [kidEvents, setKidEvents] = useState<Events>([]);
    const [matchedEvents, setMatchedEvents] = useState<MatchEvents>([]);
    const [loginState, setLoginState] = useState({
        logined: false,
        error: ''
    });
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [token, setToken] = useState(null);

    useEffect(()=>{
        const fetchToken=async ()=>{
            const tempToken = await getToken();
            setToken(tempToken);
        }
        fetchToken();
    },[]);
    

    const storeToken = async (token) => {
        try {
            console.log(token)
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



    const messageHandle = (message: MessageFromServer) => {
        switch (message.type) {
            case 'notification':
                {
                    setNotification(message.notification);
                }
                break;

            case 'getUserEvents':
                {
                    console.log("Received userEvents message:", message);
                    setUserEvents(message.userEvents || []);
                    setKidEvents((message.kidEvents || []).filter(event => event.userId !== userInfo?.id));
                }
                break;
            case 'getMatch':
                {
                    try {
                        console.log("Start to handle getMatch message");
                        if (message.success && Array.isArray(message.matches)) {
                            const sourceEventId = message.sourceEventId;
                            const newMatchEvents: MatchEvents = message.matches.map(match => ({
                                // sourceEventId,
                                event: match.event as Event,
                                score: match.score
                            }));

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
                                console.log(`Updated matchedEvents for eventId ${sourceEventId}:`, updatedMatchedEvents);
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
                        console.log("Login failed:", message.message);
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
                            .flat(2) // 展平嵌套数组，深度为2
                            .filter(event => event && event.userId !== data.userinfo.id);
                        setKidEvents(kidEvents);

                    } else {
                        console.log("Token verification failed");
                        setLoginState({ logined: false, error: 'Token verification failed' });
                        setToken(null);
                        setUserInfo(null);
                        setUserEvents([]);
                        setKidEvents([]);
                    }
                }
                break;
            case 'addkidinfo':
                {
                    if (message.success) {
                        console.log("Kid info added successfully, kidId:", message.kidId);
                        setUserInfo(message.userinfo);
                        // You might want to trigger some UI update or notification here
                    } else {
                        console.log("Failed to add kid info");
                        // Handle the error case if needed
                    }
                }
                break;
            case 'logout':
                {
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
            case 'filter':
                {
                    if (message.success) {
                        // setEvents(message.events); // This will set events to an empty array if message.events is empty
                    } else {
                        console.error('Filter request failed:', message.message);
                        // setEvents([]); // Clear events on failure as well
                    }
                }
        }
    };

    return {
        notification,
        userEvents,
        kidEvents,
        matchedEvents,
        loginState,
        userInfo,
        token,
        messageHandle,
    };
});

export default serverData;
