import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import EventDetails from './EventDetails';

const EventDisplay = ({ eventDetailsArray }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {eventDetailsArray.map((event, index) => (
        <TouchableOpacity key={index} style={styles.eventItem} onPress={() => handleEventPress(event)}>
          <Text>用户ID: {event.userId}</Text>
          <Text>孩子ID: {event.kidIds ? event.kidIds.join(', ') : '未知'}</Text>
          <Text>位置: {Array.isArray(event.location) ? event.location.join(', ') : '未知'}</Text>
          <Text>时间: {event.time ? new Date(event.time).toLocaleString() : '未知'}</Text>
          <Text>持续时间: {event.duration || '未知'} 小时</Text>
          <Text>主题: {event.topic || '未知'}</Text>
        </TouchableOpacity>
      ))}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <EventDetails 
          event={selectedEvent} 
          onClose={() => setModalVisible(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  eventItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default EventDisplay;