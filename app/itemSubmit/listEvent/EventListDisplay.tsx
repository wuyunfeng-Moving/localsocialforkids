import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import EventDetails from './EventDetails';
import FullScreenModal from '../commonItem/FullScreenModal';

const getFormattedTime = () => {
  const now = new Date();
  return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};
//sourceEventId = null，如果包含值，说明这是一个匹配活动的展示
const EventDisplay = ({ eventDetailsArray, sourceEventId }) => {
  console.log(`[${getFormattedTime()}] EventDisplay rendered with ${eventDetailsArray.length} events`);
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
          {event.topic && <Text style={styles.topic}>主题: {event.topic}</Text>}
          {event.dateTime && <Text>日期时间: {new Date(event.dateTime).toLocaleString()}</Text>}
          {event.duration && <Text>持续时间: {event.duration} 小时</Text>}
          {event.description && <Text>描述: {event.description}</Text>}
          {event.place?.name && <Text>地点: {event.place.name}</Text>}
          {event.participants && <Text>参与者: {event.participants.length}</Text>}
          {event.pendingSignUps && <Text>待定报名: {event.pendingSignUps.length}</Text>}
          {event.userId && <Text>发起人ID: {event.userId}</Text>}
          {event.id && <Text>活动ID: {event.id}</Text>}
          {event.score !== undefined && (
            <Text style={styles.score}>匹配度: {(event.score * 100).toFixed(2)}%</Text>
          )}
        </TouchableOpacity>
      ))}

      <FullScreenModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="事件详情"
      >
        <EventDetails 
          event={selectedEvent} 
          onClose={() => setModalVisible(false)}
        />
      </FullScreenModal>
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
  topic: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  score: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 5,
  },
  slideModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullScreenModalView: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EventDisplay;