import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket } from '@/app/context/WebSocketProvider';
import FullScreenModal from '../commonItem/FullScreenModal';
import { Event, Events, MatchEvent, MatchEvents, UserInfo } from '@/app/types/types';
import comWithServer from '@/app/context/comWithServer';

export type SingleEventDisplayElementType = {
    currentEvent: Event,
    depth: number,
    list: 1 | 0,
    match?: matchEventElementType
};

export const SingleEventDisplay = ({
    currentEvent,
    depth = 0, // 新增参数，用于控制递归深度
    list,
    match
}: SingleEventDisplayElementType) => {
    const [showMatchEvents, setShowMatchEvents] = useState(false);
    const [showEventDetails, setShowEventDetails] = useState(false);
    const { getMatchEvents, isEventBelongToUser, isParticipateEvent, userInfo } = useWebSocket();
    const [isDeleting, setIsDeleting] = useState(false);
    const matchEvents: MatchEvent[] = getMatchEvents(currentEvent.id);
    const { acceptSignUp } = comWithServer();

    const handleEventPress = () => {
        if (list === 1) {
            setShowEventDetails(true);
        }
    };

    const getEventState = (event: Event): 'owned' | 'signup' | 'joined' | 'available' => {
        if (isEventBelongToUser(event.userId)) {
            return 'owned';
        } else if (isParticipateEvent(event)) {
            return 'joined';
        } else if (event.pendingSignUps && event.pendingSignUps.some(signup => isEventBelongToUser(signup.sourceEventId))) {
            return 'signup';
        } else {
            return 'available';
        }
    };

    const getContainerStyle = () => {
        const state = getEventState(currentEvent);
        return [
            styles.container,
            state === 'owned' ? styles.ownedContainer :
                state === 'signup' ? styles.signupContainer :
                    state === 'joined' ? styles.joinedContainer :
                        styles.availableContainer
        ];
    };

    const handleWithdrawApplication = () => {
        // Implement withdraw application logic here
        // console.log("Withdrawing application for match event:", selectedMatchEvent?.event.id);
    };

    const handleExitMatchEvent = () => {
        // Implement exit logic here
        // console.log("Exiting match event:", selectedMatchEvent?.event.id);
    };

    const handleRejectSignUp = async (signUpId: number) => {
        setIsDeleting(true);
        try {
            await acceptSignUp(currentEvent.id, signUpId, false, () => {
                console.log("success");
            });
        } catch (error) {
            console.error("Error rejecting sign-up:", error);
        }
        setIsDeleting(false);
    };

    const handleAcceptSignUp = async (signUpId: number) => {
        setIsDeleting(true);
        try {
            await acceptSignUp(currentEvent.id, signUpId, true, () => {
                console.log("success");
            });
            // Optionally, update the local state or trigger a refresh
        } catch (error) {
            console.error("Error accepting sign-up:", error);
        }
        setIsDeleting(false);
    };

    return (
        // <TouchableOpacity onPress={handleEventPress} disabled={list !== 1}>
        <View style={getContainerStyle()}>
            <Text style={styles.title}>{currentEvent.topic}</Text>

            {/* Add state display */}
            <View style={styles.infoRow}>
                <Ionicons name="flag-outline" size={20} color="#666" />
                <Text style={styles.infoText}>状态: {getEventState(currentEvent)}</Text>
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.infoText}>{currentEvent.dateTime} (持续 {currentEvent.duration} 小时)</Text>
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.infoText}>
                    经度: {currentEvent.place.location[0]}, 纬度: {currentEvent.place.location[1]}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={20} color="#666" />
                <Text style={styles.infoText}>最多参与人数: {currentEvent.place.maxNumber}</Text>
            </View>

            {currentEvent.description && (
                <View style={styles.infoRow}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>{currentEvent.description}</Text>
                </View>
            )}

            {currentEvent.kidIds && currentEvent.kidIds.length > 0 && (
                <View style={styles.infoRow}>
                    <Ionicons name="people-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>参与的孩子ID: </Text>
                    {currentEvent.kidIds.map((kidId, index) => (
                        <Text key={kidId} style={styles.kidText}>
                            {kidId}
                            {index < currentEvent.kidIds.length - 1 ? ', ' : ''}
                        </Text>
                    ))}
                </View>
            )}

            {currentEvent.userId && (
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>创建人: {currentEvent.userId}</Text>
                </View>
            )}

            {match && (
                <View style={styles.infoRow}>
                    <Ionicons name="star-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>匹配分数: {match.score}</Text>
                </View>
            )}

            {/* 
                当pendingSignUps存在时，显示待处理的申请，并且在每个申请的下方显示拒绝、通过两种按钮，在点击后，分别发送消息到服务器。
                */}
            {list === 0 && currentEvent.pendingSignUps && currentEvent.pendingSignUps.length > 0 && (
                <View style={styles.pendingSignUpsContainer}>
                    <Text style={styles.pendingSignUpsTitle}>待处理申请:</Text>
                    {currentEvent.pendingSignUps.map((signup, index) => (
                        <View key={index} style={styles.pendingSignUpItem}>
                            <Text>来源事件ID: {signup.sourceEventId}</Text>
                            <Text>原因: {signup.reason}</Text>
                            <View style={styles.signUpButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.signUpButton, styles.rejectButton]}
                                    onPress={() => handleRejectSignUp(signup.sourceEventId)}
                                    disabled={isDeleting}
                                >
                                    <Text style={styles.buttonText}>拒绝</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.signUpButton, styles.acceptButton]}
                                    onPress={() => handleAcceptSignUp(signup.sourceEventId)}
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


        </View>
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
});


