import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';

const NotificationList = () => {
  const { notifications, comWithServer } = useWebSocket();

  const {markNotificationAsRead} = comWithServer;

  const handleNotificationPress = (notification) => {
     if (!notification.read) {
      markNotificationAsRead(notification.id);
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
});

export default NotificationList;
