import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SingleEventDisplay } from '../itemSubmit/listEvent/singleEventDisplay';
import { useWebSocket } from '../context/WebSocketProvider';

const EventDetailsPage = () => {
  const params = useLocalSearchParams();
  const { id, eventData } = params;
  const { changeEvent, userInfo } = useWebSocket(); // 假设 user 对象包含孩子信息
  const [showKidSelection, setShowKidSelection] = useState(false);
  const [selectedKidIds, setSelectedKidIds] = useState<number[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // 使用 useMemo 来解析事件数据，避免不必要的重复解析
  const event = React.useMemo(() => {
    if (eventData) {
      try {
        return JSON.parse(eventData);
      } catch (error) {
        console.error('Error parsing event data:', error);
        return null;
      }
    }
    return null;
  }, [eventData]);

  // 仅在组件挂载时打印一次参数
  React.useEffect(() => {
    console.log('Received params:', params);
    console.log('ID:', id);
    console.log('Event Data:', eventData);
  }, []); // 空依赖数组，确保效果只运行一次

  const handleJoinRequest = () => {
    if (userInfo.kidinfo.length === 0) {
      console.error('No kids available');
      return;
    }
    if (userInfo.kidinfo.length === 1) {
      submitJoinRequest([userInfo.kidinfo[0].id]);
    } else {
      setShowKidSelection(true);
    }
  };

  const submitJoinRequest = (kidIds: number[]) => {
    changeEvent.signupEvent({
      targetEventId: Number(id),
      reason: 'I would like to join this event',
      kidsId: kidIds,
      callback: (success, message) => {
        if (success) {
          console.log('Successfully signed up for the event');
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000); // 3秒后自动关闭
        } else {
          console.error('Failed to sign up:', message);
          // 可以添加错误提示
          Alert.alert('报名失败', message);
        }
      }
    });
  };

  const renderKidSelectionModal = () => (
    <Modal
      visible={showKidSelection}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>选择孩子</Text>
          {userInfo.kidinfo.map((kid) => (
            <TouchableOpacity
              key={kid.id}
              style={[
                styles.kidOption,
                selectedKidIds.includes(kid.id) && styles.selectedKidOption
              ]}
              onPress={() => {
                setSelectedKidIds(prevIds =>
                  prevIds.includes(kid.id)
                    ? prevIds.filter(id => id !== kid.id)
                    : [...prevIds, kid.id]
                );
              }}
            >
              <Text>{kid.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              if (selectedKidIds.length > 0) {
                setShowKidSelection(false);
                submitJoinRequest(selectedKidIds);
              }
            }}
          >
            <Text>确认</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowKidSelection(false);
              setSelectedKidIds([]);
            }}
          >
            <Text>取消</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!event) {
    return <Text>Loading event details...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <SingleEventDisplay currentEvent={event}/>
      <TouchableOpacity style={styles.joinButton} onPress={handleJoinRequest}>
        <Text style={styles.joinButtonText}>申请加入</Text>
      </TouchableOpacity>
      {renderKidSelectionModal()}
      <Modal
        visible={showSuccessMessage}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.successModalContainer}>
          <View style={styles.successModalContent}>
            <Text style={styles.successModalText}>报名成功！</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    color: '#666',
  },
  dateTime: {
    fontSize: 14,
    marginBottom: 5,
    color: '#444',
  },
  location: {
    fontSize: 14,
    marginBottom: 15,
    color: '#444',
  },
  maxNumber: {
    fontSize: 14,
    marginBottom: 5,
    color: '#444',
  },
  status: {
    fontSize: 14,
    marginBottom: 15,
    color: '#444',
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  kidOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedKidOption: {
    backgroundColor: '#e6f3ff',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#eee',
    alignItems: 'center',
    borderRadius: 5,
  },
  submitButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    borderRadius: 5,
  },
  successModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successModalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
  },
  successModalText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventDetailsPage;
