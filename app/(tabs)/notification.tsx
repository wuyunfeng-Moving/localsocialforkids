import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import OwnedEventDisplay from '../itemSubmit/listEvent/ownedEventDisplay';
import { Event, Notification } from '@/app/types/types';
import { useWebSocket } from '../context/WebSocketProvider';
import BackButton from '@/components/back';

const NotificationScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { userEvents,notifications,comWithServer } = useWebSocket();
  const {markNotificationAsRead} = comWithServer;
  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    if (notification.type === 'signUpRequest') {
      console.log("userEvents:::",userEvents)
      console.log(notification.targetEventId)
      const event = userEvents.find(event => event.id === notification.targetEventId);
      console.log("get event",event)
      if (event) {
        setSelectedEvent(event);
        setModalVisible(true);
      }
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
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BackButton onPress={() => setModalVisible(false)}/>
          {selectedEvent && (
            <OwnedEventDisplay
              {...selectedEvent}
            />
          )}
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
});

export default NotificationScreen;
