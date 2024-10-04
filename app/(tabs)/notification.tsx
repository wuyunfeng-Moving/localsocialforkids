import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';

const NotificationList = () => {
  const { notifications } = useWebSocket();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <ScrollView style={styles.listContainer}>
        {notifications.length > 0 ? (
          notifications.map((item, index) => (
            item && (
              <View key={`notification-${index}`} style={styles.notificationItem}>
                <Text style={styles.notificationType}>{item.type || 'Unknown Type'}</Text>
                <Text style={styles.notificationMessage}>{item.message || 'No message'}</Text>
              </View>
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
});

export default NotificationList;
