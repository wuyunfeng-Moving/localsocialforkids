import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket } from '@/app/context/WebSocketProvider';
import FullScreenModal from '../commonItem/FullScreenModal';
import { Event, Events, MatchEvent, MatchEvents, UserInfo } from '@/app/types/types';
import { useRouter } from 'expo-router';
import { Menu, Provider } from 'react-native-paper';

export type SingleEventDisplayElementType = {
    currentEvent: Event,
    depth: number,
    list: 1 | 0,
    match?: MatchEvent
};

export const SingleEventDisplay = ({
    currentEvent,
    depth = 0,
    list,
    match
}: SingleEventDisplayElementType) => {
    const router = useRouter();
    const { refreshUserData, searchEvents, isParticipateEvent, userInfo, changeEvent,getKidInfo,getUserInfo } = useWebSocket();
    const [isDeleting, setIsDeleting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [internalCurrentEvent, setInternalCurrentEvent] = useState(currentEvent);
    const [kidNames, setKidNames] = useState<{[key: number]: string}>({});
    const [creatorName, setCreatorName] = useState<string>('');
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        const updateTimeRemaining = () => {
            const now = new Date();
            const eventDate = new Date(internalCurrentEvent.dateTime);
            const endDate = new Date(eventDate.getTime() + internalCurrentEvent.duration * 60 * 60 * 1000);
            let timeDiff;

            if (internalCurrentEvent.status === 'preparing') {
                timeDiff = eventDate.getTime() - now.getTime();
            } else if (internalCurrentEvent.status === 'started') {
                timeDiff = endDate.getTime() - now.getTime();
            }

            if (timeDiff !== undefined) {
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                
                if (days > 0) {
                    setTimeRemaining(`${days}天${hours}小时`);
                } else {
                    setTimeRemaining(`${hours}小时${minutes}分钟`);
                }
            } else {
                setTimeRemaining('');
            }
        };

        updateTimeRemaining();
        const timer = setInterval(updateTimeRemaining, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [internalCurrentEvent]);

    useEffect(() => {
        // Load kid names when kidIds change
        console.log("internalCurrentEvent.kidIds",internalCurrentEvent.kidIds);
        if (internalCurrentEvent.kidIds) {
            internalCurrentEvent.kidIds.forEach(async (kidId) => {
                await getKidInfo(kidId, (kidInfo) => {

                    setKidNames(prev => ({ ...prev, [kidId]: kidInfo.name }));
                },false);
            });
        }
    }, [internalCurrentEvent.kidIds]);

    useEffect(() => {
        if (internalCurrentEvent.userId) {
            getUserInfo(internalCurrentEvent.userId, (user) => {
                setCreatorName(user.username);
            });
        }
    }, [internalCurrentEvent.userId]);

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }).format(date);
    };

    const getEventState = (event: Event): 'owned' | 'signup' | 'joined' | 'available' => {
        if (event.userId === userInfo?.id) {
            return 'owned';
        } else if (isParticipateEvent(event)) {
            return 'joined';
        } else if (event.pendingSignUps && event.pendingSignUps.some(signup => signup.sourceEventId === event.id)) {
            return 'signup';
        } else {
            return 'available';
        }
    };

    const getContainerStyle = () => {
        const state = getEventState(internalCurrentEvent);
        const statusStyle = getStatusStyle(internalCurrentEvent.status);
        return [
            styles.container,
            state === 'owned' ? styles.ownedContainer :
                state === 'signup' ? styles.signupContainer :
                    state === 'joined' ? styles.joinedContainer :
                        styles.availableContainer,
            statusStyle
        ];
    };

    const getStatusStyle = (status: Event['status']) => {
        switch (status) {
            case 'preparing':
                return styles.preparingContainer;
            case 'started':
                return styles.startedContainer;
            case 'ended':
                return styles.endedContainer;
            case 'merged':
                return styles.mergedContainer;
            default:
                return {};
        }
    };

    const getStatusText = (status: Event['status']): string => {
        switch (status) {
            case 'preparing':
                return '准备中';
            case 'started':
                return '进行中';
            case 'ended':
                return '已结束';
            case 'merged':
                return '已合并';
            default:
                return '未知状态';
        }
    };

    const handleRejectSignUp = async (signUpId: number) => {
        setIsDeleting(true);
        try {
            await changeEvent.approveSignupRequest({
                eventId: internalCurrentEvent.id,
                signupId: signUpId,
                approved: false,
                callback: async (success, message) => {
                    if (success) {
                        console.log("Successfully rejected sign-up");
                        // Refresh data and wait for completion
                        await refreshUserData();
                    } else {
                        console.error("Failed to reject sign-up:", message);
                    }
                }
            });
        } catch (error) {
            console.error('Error rejecting sign-up:', error);
        }
        setIsDeleting(false);
    };

    const handleAcceptSignUp = async (signUpId: number) => {
        setIsDeleting(true);
        try {
            await changeEvent.approveSignupRequest({
                eventId: internalCurrentEvent.id,
                signupId: signUpId,
                approved: true,
                callback: async (success, message) => {
                    if (success) {
                        console.log("Successfully accepted sign-up");
                        // Refresh data and wait for completion
                        await refreshUserData();
                    } else {
                        console.error("Failed to accept sign-up:", message);
                    }
                }
            });
        } catch (error) {
            console.error('Error accepting sign-up:', error);
        }
        setIsDeleting(false);
    };

    const handleUserPress = () => {
        if (internalCurrentEvent.userId && internalCurrentEvent.userId !== userInfo?.id) {
            router.push(`/user/followingDetail/${internalCurrentEvent.userId}`);
        }
    };

    const handleSubmitComment = async () => {
        if (!comment.trim()) return;
        
        setIsSubmittingComment(true);
        try {
            await changeEvent.submitComment({
                eventId: internalCurrentEvent.id,
                comment: comment.trim(),
                callback: async (success, message) => {
                    if (success) {
                        console.log("Successfully submitted comment");
                        setComment(''); // Clear input
                        await searchEvents.search({
                            eventId: internalCurrentEvent.id,
                            callback: (success,message,events) => {
                                if(success && events.length > 0){
                                    setInternalCurrentEvent(events[0]);
                                }
                            }
                        });
                    } else {
                        console.error("Failed to submit comment:", message);
                    }
                }
            });
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
        setIsSubmittingComment(false);
    };

    // Add this section to render existing comments
    const renderComments = () => {
        if (!internalCurrentEvent.comments || internalCurrentEvent.comments.length === 0) {
            return <Text style={styles.noCommentsText}>暂无评论</Text>;
        }

        // Sort comments by timestamp in descending order (newest first)
        const sortedComments = [...internalCurrentEvent.comments].sort((a, b) => 
            new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        );

        return sortedComments.map((comment, index) => (
            <View key={index} style={styles.commentItem}>
                <Text style={styles.commentUser}>{comment.userId}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>
                    {formatDateTime(comment.timestamp)}
                </Text>
            </View>
        ));
    };

    const handleDeleteEvent = async () => {
        setIsDeleting(true);
        try {
            await changeEvent.deleteEvent({
                eventId: internalCurrentEvent.id,
                callback: async (success, message) => {
                    if (success) {
                        console.log("Successfully deleted event");
                        await refreshUserData();
                    } else {
                        console.error("Failed to delete event:", message);
                    }
                }
            });
        } catch (error) {
            console.error('Error deleting event:', error);
        }
        setIsDeleting(false);
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView>
                <View style={getContainerStyle()}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>{internalCurrentEvent.topic}</Text>
                        <View style={styles.headerRightContainer}>
                            {getEventState(internalCurrentEvent) === 'owned' && (
                                <Menu
                                    visible={menuVisible}
                                    onDismiss={() => setMenuVisible(false)}
                                    anchor={
                                        <TouchableOpacity onPress={() => setMenuVisible(true)}>
                                            <Ionicons name="ellipsis-vertical" size={24} color="#666" />
                                        </TouchableOpacity>
                                    }
                                >
                                    <Menu.Item 
                                        onPress={() => {
                                            setMenuVisible(false);
                                            // Add edit logic here
                                        }} 
                                        title="修改" 
                                    />
                                    <Menu.Item 
                                        onPress={() => {
                                            setMenuVisible(false);
                                            handleDeleteEvent();
                                        }} 
                                        title="删除"
                                        titleStyle={{ color: '#FF3B30' }}
                                    />
                                </Menu>
                            )}
                            {getEventState(internalCurrentEvent) === 'owned' ? (
                                <Ionicons name="person" size={24} color="#666" />
                            ) : getEventState(internalCurrentEvent) === 'joined' ? (
                                <Ionicons name="people" size={24} color="#666" />
                            ) : null}
                        </View>
                    </View>

                    {/* 基本信息 - 在列表和详情视图中都显示 */}
                    <View style={styles.infoRow}>
                        <Ionicons name="flag-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>状态: {getStatusText(internalCurrentEvent.status)}</Text>
                        {timeRemaining && (
                            <Text style={styles.timeRemainingText}>
                                {internalCurrentEvent.status === 'preparing' ? '距离开始还有: ' : '距离结束还有: '}
                                {timeRemaining}
                            </Text>
                        )}
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            {formatDateTime(internalCurrentEvent.dateTime)} (持续 {internalCurrentEvent.duration} 小时)
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            经度: {internalCurrentEvent.place.location[0]}, 纬度: {internalCurrentEvent.place.location[1]}
                        </Text>
                    </View>

                    {/* 详细信息 - 仅在详情视图中显示 */}
                    {list === 0 && (
                        <>
                            <View style={styles.infoRow}>
                                <Ionicons name="people-outline" size={20} color="#666" />
                                <Text style={styles.infoText}>最多参与人数: {internalCurrentEvent.place.maxNumber}</Text>
                            </View>

                            {internalCurrentEvent.description && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                                    <Text style={styles.infoText}>{internalCurrentEvent.description}</Text>
                                </View>
                            )}

                            {internalCurrentEvent.kidIds && internalCurrentEvent.kidIds.length > 0 && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="people-circle-outline" size={20} color="#666" />
                                    <Text style={styles.infoText}>参与的孩子: </Text>
                                    {internalCurrentEvent.kidIds.map((kidId, index) => (
                                        <Text key={kidId} style={styles.kidText}>
                                            {kidNames[kidId] || kidId}
                                            {index < internalCurrentEvent.kidIds.length - 1 ? ', ' : ''}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {internalCurrentEvent.userId && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="person-outline" size={20} color="#666" />
                                    <Text style={styles.infoText}>创建人: </Text>
                                    <TouchableOpacity 
                                        onPress={handleUserPress}
                                        disabled={internalCurrentEvent.userId === userInfo?.id}
                                    >
                                        <Text style={[  
                                            styles.infoText,
                                            internalCurrentEvent.userId !== userInfo?.id && styles.clickableText
                                        ]}>{creatorName}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {match && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="star-outline" size={20} color="#666" />
                                    <Text style={styles.infoText}>匹配分数: {match.score}</Text>
                                </View>
                            )}

                            {/* 待处理申请部分 */}
                            {internalCurrentEvent.pendingSignUps && internalCurrentEvent.pendingSignUps.length > 0 && (
                                <View style={styles.pendingSignUpsContainer}>
                                    <Text style={styles.pendingSignUpsTitle}>待处理申请:</Text>
                                    {internalCurrentEvent.pendingSignUps.map((signup, index) => (
                                        <View key={index} style={styles.pendingSignUpItem}>
                                            <Text>
                                                {signup.type === 'kid' ? '孩子ID: ' : '事件ID: '}
                                                <Text style={styles.idText}>
                                                    {signup.type === 'kid' ? signup.kidIds.join(', ') : signup.sourceEventId}
                                                </Text>
                                            </Text>
                                            <Text>申请类型: {signup.type === 'kid' ? '孩子' : '事件'}</Text>
                                            <Text>原因: {signup.reason}</Text>
                                            <View style={styles.signUpButtonContainer}>
                                                <TouchableOpacity
                                                    style={[styles.signUpButton, styles.rejectButton]}
                                                    onPress={() => handleRejectSignUp(signup.id)}
                                                    disabled={isDeleting}
                                                >
                                                    <Text style={styles.buttonText}>拒绝</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.signUpButton, styles.acceptButton]}
                                                    onPress={() => handleAcceptSignUp(signup.id)}
                                                    disabled={isDeleting}
                                                >
                                                    <Text style={styles.buttonText}>通过</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {isDeleting && <ActivityIndicator style={styles.loader} />}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* 评论部分 */}
                            <View style={styles.commentSection}>
                                <Text style={styles.commentTitle}>评论</Text>
                                <View style={styles.existingComments}>
                                    {renderComments()}
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
            {list === 0 && (
                <View style={styles.commentInputWrapper}>
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="输入您的评论..."
                            multiline
                        />
                        <TouchableOpacity
                            style={[
                                styles.commentButton,
                                (!comment.trim() || isSubmittingComment) && styles.disabledButton
                            ]}
                            onPress={handleSubmitComment}
                            disabled={!comment.trim() || isSubmittingComment}
                        >
                            {isSubmittingComment ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.commentButtonText}>提交</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ownedContainer: {
        backgroundColor: '#E6F3FF', // Light blue
    },
    signupContainer: {
        backgroundColor: '#FFF9E6', // Light yellow
    },
    joinedContainer: {
        backgroundColor: '#E6FFE6', // Light green
    },
    availableContainer: {
        backgroundColor: '#FFF', // White (default)
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
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
    pendingSignUpsContainer: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 8,
    },
    pendingSignUpsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    pendingSignUpItem: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    signUpButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    signUpButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        minWidth: 80,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#FF6B6B',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 8,
    },
    kidText: {
        fontSize: 16,
        color: '#666',
    },
    preparingContainer: {
        backgroundColor: '#FFF9C4', // Light yellow
    },
    startedContainer: {
        backgroundColor: '#C8E6C9', // Light green
    },
    endedContainer: {
        backgroundColor: '#FFCDD2', // Light red
    },
    mergedContainer: {
        backgroundColor: '#E1BEE7', // Light purple
    },
    timeRemainingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    clickableText: {
        color: '#007AFF',
        textDecorationLine: 'underline',
    },
    commentSection: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 16,
    },
    commentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginRight: 8,
        minHeight: 40,
        backgroundColor: '#fff',
    },
    commentButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    commentButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    existingComments: {
        marginBottom: 16,
    },
    commentItem: {
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    commentUser: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    commentText: {
        color: '#666',
        marginBottom: 4,
    },
    commentTime: {
        fontSize: 12,
        color: '#999',
    },
    noCommentsText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        marginVertical: 16,
    },
    actionButtonsContainer: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 16,
    },
    actionButton: {
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    commentInputWrapper: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        padding: 8,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginRight: 8,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#fff',
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
