import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import serverData from '../context/serverData';
import comWithServer from '../context/comWithServer';

const NotificationList = () => {
  const { notifications, setting } = serverData();

  const {markNotificationAsRead} = comWithServer();

  const handleNotificationPress = (notification) => {
    // if (notification.read) {
      markNotificationAsRead(notification.id);
    // }
  };

  useEffect(()=>{
    console.log("notifications in page",notifications);
  },[notifications])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
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
