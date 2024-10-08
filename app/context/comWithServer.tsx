import { useState, useEffect } from 'react';

const comWithServer = (orderToServer,userEvents,notifications,setAndStoreNotifications) => {

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
              console.log("newNoti", newNoti);
              setAndStoreNotifications(newNoti);
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

    return ({
        handleDeleteEvent,
        handleCreateEvent,
        handleSignupEvent,
        markNotificationAsRead,
        acceptSignUp // Add this new function to the returned object
    }
    );
}

export default comWithServer;
