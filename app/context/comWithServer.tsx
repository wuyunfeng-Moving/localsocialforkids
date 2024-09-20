import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';

const comWithServer = () => {
    const { orderToServer,userEvents } = useWebSocket() ?? {};

    //get matches at first get the userinfo
    useEffect(() => {
        orderToServer('getMatch', { start: 0, end: 10 }, (matchMessage) => {
            // Handle the matched events here
            // You might want to store these matched events in a state
            console.log('Matched events:', matchMessage);
        });
        orderToServer('notifications')
    }
        , [userEvents]);

    const handleDeleteEvent = ((event, callback) => {
        if (!orderToServer) {
            callback({ success: false, error: 'WebSocket not available' });
            return;
        }
        orderToServer('deleteEvent', { event }, (resmsg) => {
            if (resmsg.success === true) {
                orderToServer('getUserEvents', {}, () => {
                    callback({ success: true });
                });
            }
            else {
                callback({ success: false, error: resmsg.message });
            }
        })
    });

    const handleCreateEvent = ((event, callback) => {
        if (!orderToServer) {
            callback({ success: false, error: 'WebSocket not available' });
            return;
        }
        orderToServer('addNewEvent', { event }, (resmsg) => {
            if (resmsg.success === true) {
                orderToServer('getUserEvents', {}, () => {
                    callback({ success: true });
                });
            }
            else {
                callback({ success: false, error: resmsg.message });
            }
        })
    });

    const handleSignupEvent = ((sourceEventId: number, targetEventId: number, reason: string,callback) => {
        if (!orderToServer) {
            console.error('WebSocket not available');
            return;
        }
        orderToServer('signUpEvent', { signUpEvent: { sourceEventId: sourceEventId, targetEventId: targetEventId, reason: reason } }, callback)
    }

    );

    return ({
        handleDeleteEvent,
        handleCreateEvent,
        handleSignupEvent
    }
    );
}

export default comWithServer;
