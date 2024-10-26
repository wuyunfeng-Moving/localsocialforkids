import { useState, useEffect } from 'react';
import serverData from './serverData';

const comWithServer = (orderToServer, userEvents, notifications) => {
    //get matches at first get the userinfo
    useEffect(() => {
        orderToServer('getMatch', { start: 0, end: 10 }, (matchMessage) => {
            // Handle the matched events here
            // You might want to store these matched events in a state
            console.log('Matched events:', matchMessage);
        });
        orderToServer('notifications');
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

    const markNotificationAsRead = (notificationId: number) => {
        orderToServer(
          'setNotificationReaded',
          { setNotificationReaded: { id: notificationId } },
          (message) => {
            if (message.success) {
              console.log("setNotificationReaded:", message);
              const newNoti = notifications.map(notification =>
                notification.id === notificationId
                  ? { ...notification, read: !notification.read }
                  : notification
              );
            } else {
              console.error('Failed to mark notification as read:', message.error);
            }
          }
        );
      };

    const handleSignupEvent = ((sourceEventId: number, targetEventId: number, reason: string,callback) => {
        if (!orderToServer) {
            console.error('WebSocket not available');
            return;
        }
        orderToServer('signUpEvent', { signUpEvent: { sourceEventId: sourceEventId, targetEventId: targetEventId, reason: reason } }, callback)
    }
    );

    const acceptSignUp = (
        eventId: number,
        targetEventId: number,
        approve: boolean,
        callback: (success: boolean) => void
    ) => {
        if (!orderToServer) {
            console.error('WebSocket not available');
            callback(false);
            return;
        }

        console.log("acceptSignUp is called!",eventId,targetEventId,approve);

        orderToServer(
            'approveSignUp',
            {approveSignUp: { eventId, targetEventId, approve }},
            (response: { success: boolean; message?: string }) => {
                if (response.success) {
                    callback(true);
                } else {
                    console.error('Failed to accept sign up:', response.message);
                    callback(false);
                }
            }
        );
    };

    const ajaxRequest = async (endpoint: string, method: string = 'GET', data: any = null) => {
        const url = `${BASE_URL}${endpoint}`;
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text(); // 改为 text()，因为服务器返回纯文本
        } catch (error) {
            console.error("AJAX request failed:", error);
            throw error;
        }
    };




    return ({
        handleDeleteEvent,
        handleCreateEvent,
        handleSignupEvent,
        markNotificationAsRead,
        acceptSignUp
    });
}

export default comWithServer;
