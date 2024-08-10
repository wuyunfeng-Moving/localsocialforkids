import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';

const EventDetails = ({ event, onClose }) => {
  const handleJoinEvent = () => {
    // 实现加入事件的逻辑
    onClose();
  };

  const handleDeleteEvent = () => {
    // 实现删除事件的逻辑
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
      {/* 添加更多详细信息 */}
      <View style={styles.buttonContainer}>
        <Button title="加入事件" onPress={handleJoinEvent} />
        <Button title="删除事件" onPress={handleDeleteEvent} />
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text>关闭</Text>
      </TouchableOpacity>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
  },
});

export default EventDetails;