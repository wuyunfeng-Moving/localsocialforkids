import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Notification } from '@/app/types/notification_types';
import { Event } from '@/app/types/types';
import { useWebSocket } from '../context/WebSocketProvider';
import { router } from 'expo-router';
import BackButton from '@/components/back';

const NotificationScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { userEvents,notifications,searchEvents,setNotificationsRead} = useWebSocket();
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      setNotificationsRead(notification.id, (success, message) => {
        if (success) {
          console.log('Notification marked as read');
        } else {
          console.error('Failed to mark notification as read:', message);
        }
      }); 
    }

    switch (notification.type) {
      case 'signUpRequest':
        searchEvents.search({
          eventId: Number(notification.eventId),
          callback: (success, message, events) => {
            if(success) {
              router.push({
                pathname: '/events/[id]',
                params: { id: notification.eventId, eventData: JSON.stringify(events[0]) }
              });
            } else {
              setErrorMessage(message);
              setErrorModalVisible(true);
            }
          }
        });
        break;

      case 'activityCreated':
        searchEvents.search({
          eventId: Number(notification.activityId),
          callback: (success, message, events) => {
            if(success) {
              router.push({
                pathname: '/events/[id]',
                params: { 
                  id: notification.activityId, 
                  eventData: JSON.stringify(events[0]) 
                }
              });
            } else {
              setErrorMessage(message || '获取活动详情失败');
              setErrorModalVisible(true);
            }
          }
        });
        break;

      case 'chatMessage':
        // Navigate to chat screen with the chat ID
        router.push({
          pathname: '/chat',
          params: { 
            id: notification.chatId,
            eventId: notification.eventId
          }
        });
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.listContainer}>
        {notifications.length > 0 ? (
          notifications.map((item, index) => (
            item && (
              <TouchableOpacity
                key={`notification-${index}`}
                style={[
                  styles.notificationItem,
                  !item.read && styles.unreadNotification
                ]}
                onPress={() => handleNotificationPress(item)}
              >
                <Text style={styles.notificationType}>{item.type + '   ' + item.createdAt || 'Unknown Type'}</Text>
                <Text style={styles.notificationMessage}>{item.message || 'No message'}</Text>
              </TouchableOpacity>
            )
          ))
        ) : (
          <Text>No notifications</Text>
        )}
      </ScrollView>
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listContainer: {
    height: Dimensions.get('window').height - 100, // Adjust this value as needed
  },
  notificationItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  notificationType: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    marginTop: 5,
  },
  unreadNotification: {
    backgroundColor: '#d0d0d0',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    minWidth: 250,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default NotificationScreen;
