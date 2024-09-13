import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useWebSocket } from '@/app/context/WebSocketProvider';
import EventDisplay from './EventListDisplay';
import FullScreenModal from '../commonItem/FullScreenModal';
import 


//单个事件的显示组件，根据当前的事件，现实相应的操作界面：
//1.查看匹配，如果有匹配的事件；
//2.删除事件，如果事件属于我；
//3.加入事件，如果事件不属于我；
//4.退出事件，如果我是事件的参与者；
//5.显示事件更加详细的信息；
const EventDetails = ({ event, onClose }) => {
  const [showMatchEvents, setShowMatchEvents] = useState(false);
  const { getMatchEvents,isEventBelongToUser,isParticipateEvent } = useWebSocket();
  const matchEvents = getMatchEvents(event.id).flat().map(item => ({
    ...item.event,
    score: item.score
  }));

  console.log("matchEvents in EventDetails:",matchEvents);

  const handleJoinEvent = () => {
    if (!event || !event.id) {
      Alert.alert('错误', '事件信息不完整');
      return;
    }
    onClose();
  };

  const handleDeleteEvent = () => {

    onClose();
  };

  const handleLeaveEvent = () => {
    onClose();
  };

  const renderMatchEvent = ({ item }) => (
    <View style={styles.matchEventItem}>
      <Text>用户ID: {item.userId}</Text>
      <Text>时间: {item.time ? new Date(item.time).toLocaleString() : '未知'}</Text>
      <Text>主题: {item.topic || '未知'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.modalContent}>
          <Text>用户ID: {event.userId}</Text>
          <Text>孩子ID: {event.kidIds ? event.kidIds.join(', ') : '未知'}</Text>
          <Text>位置: {Array.isArray(event.location) ? event.location.join(', ') : '未知'}</Text>
          <Text>时间: {event.time ? new Date(event.time).toLocaleString() : '未知'}</Text>
          <Text>持续时间: {event.duration || '未知'} 小时</Text>
          <Text>主题: {event.topic || '未知'}</Text>
          <Text>描述：{event.description || ''}</Text>
          
          {matchEvents && matchEvents.length > 0 && (
            <View style={styles.matchEventsContainer}>
              <Button 
                title={showMatchEvents ? "收起匹配" : "查看匹配"} 
                onPress={() => setShowMatchEvents(!showMatchEvents)} 
              />
              <FullScreenModal
                visible={showMatchEvents}
                onClose={() => setShowMatchEvents(false)}
                title="匹配事件列表"
              >
                <ScrollView>
                  <EventDisplay eventDetailsArray={matchEvents} sourceEventId={event.id}/>
                </ScrollView>
              </FullScreenModal>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {isEventBelongToUser(event) ? (
              <Button title="删除事件" onPress={handleDeleteEvent} />
            ) : isParticipateEvent(event) ? (
              <Button title="退出事件" onPress={handleLeaveEvent} />
            ) : (
              <Button title="加入事件" onPress={handleJoinEvent} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  scrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  kidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  matchEventsContainer: {
    marginTop: 20,
    width: '100%',
  },
  matchEventsList: {
    maxHeight: 200,
  },
  matchEventItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default EventDetails;