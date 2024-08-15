import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import EventDetails from './EventDetails';

const EventDisplay = ({ eventDetailsArray, userInfo }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const getChildName = (kidId) => {
    const kid = userInfo.kidinfo.find(kid => kid.id === kidId);
    return kid ? kid.name : '未知';
  };

  const getRelationship = (userId) => {
    if (userId === userInfo.id) {
      return '发起者（自己）';
    }
    // 这里可以添加更多的逻辑来确定关系，如果有其他用户信息的话
    return '其他发起者';
  };

  return (
    <View style={styles.container}>
      {eventDetailsArray.map((event, index) => (
        <TouchableOpacity key={index} style={styles.eventItem} onPress={() => handleEventPress(event)}>
          <Text>发起者: {getRelationship(event.userId)}</Text>
          <Text>孩子: {event.kidIds ? event.kidIds.map(getChildName).join(', ') : '未知'}</Text>
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
          userInfo={userInfo}
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