import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '../context/WebSocketProvider';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types/types';
import { navigateToAddKid } from '../navigation/routeHelper';

const EventDetailsPage = () => {
  const params = useLocalSearchParams();
  const { eventId } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const { changeEvent, userInfo,getUserInfo,getKidInfo,getEventById} = useWebSocket(); // 假设 user 对象包含孩子信息
  const [showKidSelection, setShowKidSelection] = useState(false);
  const [showAddKidInfo, setShowAddKidInfo] = useState(false);
  const [selectedKidIds, setSelectedKidIds] = useState<number[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [creatorName, setCreatorName] = useState<string>('');
  const [kidNames, setKidNames] = useState<{[key: number]: string}>({});
  const [applicantNames, setApplicantNames] = useState<{[key: number]: string}>({});
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [usernames, setUsernames] = useState<{[key: number]: string}>({});
  // 使用 useMemo 来解析事件数据，避免不必要的重复解析
  useEffect(() => {
    if (eventId) {
      console.log("eventId",eventId);
      try {
        getEventById(Number(eventId), (event) => {
          if (event) {
            setEvent(event);
          }
        });
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    }
  }, [eventId]);



  // 仅在组件挂载时打印一次参数
  useEffect(() => {
    // console.log('Received params:', params);
    console.log('ID:', eventId);
    // console.log('Event Data:', eventData);
    // console.log("event",event);
  }, [event]); // 空依赖数组，确保效果只运行一次

  useEffect(() => {
    if (event) {
      getUserInfo(event.userId, (userInfo) => {
        setCreatorName(userInfo.username);
      });
    }
  }, [event]);

  useEffect(() => {
    if (event?.pendingSignUps) {
      event.pendingSignUps.forEach(applicant => {
        getUserInfo(applicant.userId, (userInfo) => {
          setApplicantNames(prev => ({
            ...prev,
            [applicant.userId]: userInfo.username
          }));
        });
      });
    }
  }, [event]);

  const getKidName = (kidId: number) => {
    if (kidNames[kidId]) {
      return kidNames[kidId];
    } else {
      getKidInfo(kidId, (kidInfo) => {
        setKidNames(prev => ({
          ...prev,
          [kidId]: kidInfo.name
        }));
      }, false);
    }
  };

  const getKidNameLink = (kidId: number) => {
    const kidname = getKidName(kidId);
    
    return (
      <Link href={`/user/kidsDetail/${kidId}`} key={kidId}>
        <Text style={styles.kidLink}>{kidname}</Text>
      </Link>
    );
  };

  const getUserNameLink = (userId: number) => {
    if (!usernames[userId]) {
      getUserInfo(userId, (userInfo) => {
        setUsernames(prev => ({
          ...prev,
          [userId]: userInfo.username
        }));
      });
    }
    
    return (
      <Link href={`/user/followingDetail/${userId}`} key={userId}>
        <Text style={styles.kidLink}>{usernames[userId] || '加载中...'}</Text>
      </Link>
    );
  }

  const handleJoinRequest = () => {
    if (userInfo?.kidinfo.length === 0) {
      console.log("no kid info");
      setShowAddKidInfo(true);
      return;
    }
    if (userInfo?.kidinfo.length === 1) {
      submitJoinRequest([userInfo.kidinfo[0].id]);
    } else {
      setShowKidSelection(true);
    }
  };


  const handleAddKidInfo = (add: boolean) => {
    setShowAddKidInfo(false);
    if (add) {
      navigateToAddKid();
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

  const handleApproval = (signupId: number, approved: boolean) => {
    const message = approved ? '确认接受申请？' : '确认拒绝申请？';
    Alert.alert(
      '确认操作',
      message,
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确定',
          onPress: () => {
            changeEvent.approveSignupRequest({
              eventId: Number(id),
              signupId: signupId,
              approved: approved,
              rejectionReason: approved ? undefined : '申请被拒绝',
              callback: (success, message) => {
                if (success) {
                  Alert.alert('成功', approved ? '已接受申请' : '已拒绝申请');
                } else {
                  Alert.alert('失败', message);
                }
              }
            });
          }
        }
      ]
    );
  };

  const renderApplicantItem = (applicant: any) => (
    <View key={applicant.id} style={styles.applicantItem}>
      <Text>申请人: {getUserNameLink(applicant.userId)}</Text>
      <Text>申请理由: {applicant.reason}</Text>
      <Text>申请孩子: 
        {applicant.kidIds.map((kid: number, index: number) => (
          <React.Fragment key={kid}>
            {index > 0 && ', '}
            {getKidNameLink(kid)}
          </React.Fragment>
        ))}
      </Text>
      <View style={styles.approvalButtons}>
        <TouchableOpacity 
          style={[styles.approvalButton, styles.acceptButton]}
          onPress={() => handleApproval(applicant.id, true)}
        >
          <Text style={styles.approvalButtonText}>接受</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.approvalButton, styles.rejectButton]}
          onPress={() => handleApproval(applicant.id, false)}
        >
          <Text style={styles.approvalButtonText}>拒绝</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add these helper functions to check user status
  const isEventCreator = useMemo(() => {
    return event?.userId === userInfo?.id;
  }, [event, userInfo]);

  const isParticipant = useMemo(() => {
    return event?.kidIds.some(kidId => 
      userInfo?.kidinfo.some(kid => kid.id === kidId)
    );
  }, [event, userInfo]);

  const isApplicant = useMemo(() => {
    return event?.pendingSignUps?.some(signup => 
      signup.userId === userInfo?.id
    );
  }, [event, userInfo]);

  const handleSubmitComment = () => {
    if (!comment.trim()) {
      Alert.alert('提示', '请输入评论内容');
      return;
    }

    setIsSubmittingComment(true);
    changeEvent.addComment({
      eventId: Number(id),
      comment: comment.trim(),
      callback: (success, message) => {
        setIsSubmittingComment(false);
        if (success) {
          setComment(''); // Clear input
          Alert.alert('成功', '评论已发布');
        } else {
          Alert.alert('失败', message || '评论发布失败');
        }
      }
    });
  };

  if (!event) {
    return <Text>Loading event details...</Text>;
  } 

  console.log("event in eventDetailsPage",event);

  return (
    <View style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <Text>活动主题：{event.topic}</Text>
        <Text>创建人：{getUserNameLink(event.userId)}</Text>
        <Text>状态：{event.status}</Text>
        <Text>时间：{event.dateTime}</Text>
        <Text>地点：{event.place.location}</Text>
        <Text>最大人数：{event.place.maxNumber}</Text>
        <Text>已经参与的孩子：
          {event.kidIds.map((id, index) => (
            <React.Fragment key={id}>
              {index > 0 && ', '}
              {getKidNameLink(id)}
            </React.Fragment>
          ))}
        </Text>
      </View>
      <ScrollView style={styles.scrollContainer}>
        {isEventCreator && (
          <View style={styles.applicantsSection}>
            <Text style={styles.sectionTitle}>申请者列表</Text>
            {event.pendingSignUps && event.pendingSignUps.length > 0 ? (
              event.pendingSignUps.map(applicant => renderApplicantItem(applicant))
            ) : (
              <Text style={styles.noApplicantsText}>暂无申请者</Text>
            )}
          </View>
        )}
        <View style={styles.actionButtonsContainer}>
          {!isEventCreator && !isParticipant && !isApplicant && event.status !== 'ended' && (
            <TouchableOpacity style={styles.joinButton} onPress={handleJoinRequest}>
              <Text style={styles.joinButtonText}>申请加入</Text>
            </TouchableOpacity>
          )}
          {event.userId === userInfo?.id ? (
            event.chatIds?.length > 0 && (
              <View style={styles.chatButtonsContainer}>
                {event.chatIds.map((chatId) => (
                  <TouchableOpacity 
                    key={chatId}
                    style={styles.chatButton} 
                    onPress={() => router.push({
                      pathname: '/chat',
                      params: { comingChatId: chatId, eventId: id }
                    })}
                  >
                    <Text style={styles.chatButtonText}>查看聊天:{chatId}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )) : (
              <TouchableOpacity 
                style={styles.chatButton} 
                onPress={() => router.push({
                  pathname: '/chat',
                  params: { eventId: id }
                })}
              >
                <Ionicons name="chatbubble-outline" size={24} color="white" />
              </TouchableOpacity>
            )
          }
        </View>
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

        <Modal
          visible={showAddKidInfo}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.addKidInfoModalContainer}>
            <View style={styles.addKidInfoModalContent}>
              <Text style={styles.modalTitle}>添加孩子信息</Text>
              <Text style={styles.modalDescription}>您需要先添加孩子信息才能报名活动</Text>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={() => handleAddKidInfo(true)}
              >
                <Text style={styles.buttonText}>去添加</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => handleAddKidInfo(false)}
              >
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>评论</Text>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="写下你的评论..."
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.commentSubmitButton,
                isSubmittingComment && styles.disabledButton
              ]}
              onPress={handleSubmitComment}
              disabled={isSubmittingComment}
            >
              <Text style={styles.commentSubmitText}>
                {isSubmittingComment ? '发送中...' : '发送'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Display comments */}
          {event.comments && event.comments.length > 0 ? (
            <View style={styles.commentsList}>
              {event.comments.map((comment, index) => (
                <View key={index} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{getUserNameLink(comment.userId)}</Text>
                    <Text style={styles.commentTime}>{new Date(comment.timestamp).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noCommentsText}>暂无评论</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollContainer: {
    flex: 1,
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
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  kidOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedKidOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  closeButton: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderRadius: 12,
  },
  submitButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    borderRadius: 12,
    elevation: 2,
  },
  successModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successModalContent: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  successModalText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  chatButtonsContainer: {
    marginTop: 10,
  },
  addKidInfoModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addKidInfoModalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applicantsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  applicantItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  noApplicantsText: {
    color: '#666',
    fontStyle: 'italic',
  },
  kidLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  approvalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  approvalButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  approvalButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  commentSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    maxHeight: 120,
    backgroundColor: '#f9f9f9',
  },
  commentSubmitButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  commentSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentsList: {
    marginTop: 16,
  },
  commentItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
});

export default EventDetailsPage;
