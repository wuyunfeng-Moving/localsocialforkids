import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, Switch } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';

const EventDetails = ({ event, onClose }) => {
  console.log('Event:', event);
  const [selectedKids, setSelectedKids] = useState({});
  const { send, userInfo } = useWebSocket();
  const { kidinfo, userinfo } = userInfo || {};

  console.log('Current User:', userInfo);

  const handleJoinEvent = () => {
    if (!event || !event.id) {
      Alert.alert('错误', '事件信息不完整');
      return;
    }

    if (event.userId === userinfo?.id) {
      Alert.alert('提示', '您不能加入自己创建的事件');
      return;
    }

    const selectedKidIds = Object.keys(selectedKids).filter(id => selectedKids[id]);
    if (kidinfo && kidinfo.length > 0 && selectedKidIds.length === 0) {
      Alert.alert('提示', '请选择至少一个孩子');
      return;
    }

    if (!userinfo?.id) {
      Alert.alert('错误', '用户ID未定义');
      return;
    }

    send({
      type: 'joinEvent',
      data: {
        eventId: event.id,
        userId: userinfo.id,
        kidIds: selectedKidIds,
      }
    });
    onClose();
  };

  return (
    <View style={styles.modalContent}>
      <Text style={styles.title}>事件详情</Text>
      <Text>用户ID: {event.userId}</Text>
      <Text>孩子ID: {event.kidIds ? event.kidIds.join(', ') : '未知'}</Text>
      <Text>位置: {Array.isArray(event.location) ? event.location.join(', ') : '未知'}</Text>
      <Text>时间: {event.time ? new Date(event.time).toLocaleString() : '未知'}</Text>
      <Text>持续时间: {event.duration || '未知'} 小时</Text>
      <Text>主题: {event.topic || '未知'}</Text>
      {kidinfo && kidinfo.length > 0 && (
        <View>
          <Text style={styles.subtitle}>选择参与的孩子：</Text>
          {kidinfo.map(kid => (
            <View key={kid.id} style={styles.kidItem}>
              <Text>{kid.name}</Text>
              <Switch
                value={selectedKids[kid.id] || false}
                onValueChange={(value) => {
                  setSelectedKids(prev => ({...prev, [kid.id]: value}));
                }}
              />
            </View>
          ))}
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="加入事件" onPress={handleJoinEvent} />
        <Button title="关闭" onPress={onClose} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 50,
    marginHorizontal: 20,
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
});

export default EventDetails;