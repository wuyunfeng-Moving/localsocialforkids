import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket } from '@/app/context/WebSocketProvider';
import FullScreenModal from '../commonItem/FullScreenModal';
import { Event, Events, MatchEvent,MatchEvents } from '@/app/types/types';
import comWithServer from '@/app/context/comWithServer';

export type SingleEventDisplayElementType = {
    dateTime: string,
    duration: number,
    kidIds: number[],
    place: {
        location: [number, number],
        maxNum: number
    },
    userId: number,
    Topic: string,
    id: number,
    description?: string,
    list: 1 | 0,
    match?: {
        sourceEventId: number,
        targetEventId: number,
        score: number,
    },
    depth: number,
};

export const SingleEventDisplay = ({
    Topic,
    dateTime,
    duration,
    place,
    description,
    userId,
    kidIds = [],
    match,
    list,
    id,
    depth = 0, // 新增参数，用于控制递归深度
}: SingleEventDisplayElementType & { depth?: number }) => {
    const userName = userId ? `用户${userId}` : '未知用户';
    const [showMatchEvents, setShowMatchEvents] = useState(false);
    const [showEventDetails, setShowEventDetails] = useState(false);
    const { getMatchEvents, isEventBelongToUser, isParticipateEvent } = useWebSocket();
    const [isDeleting, setIsDeleting] = useState(false);
    const matchEvents:MatchEvent[] = getMatchEvents(id);
    const { handleDeleteEvent, handleSignupEvent } = comWithServer();

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

    const currentEvent: Event = {
        id,
        topic: Topic as string,
        dateTime,
        duration,
        place: {
            location: place.location,
            maxNumber: place.maxNum
        },
        description: description as string,
        userId: userId as number,
        kidIds,
    };

    const targetEventForMatch = (match: MatchEvent): SingleEventDisplayElementType | null => {
        if (!match) return null;
        console.log("targetEventForMatch", match);

        const result = {
            kidIds: match.event.kidIds,
            dateTime: match.event.dateTime,
            duration: match.event.duration,
            description: match.event.description,
            place: {
                location: match.event.place.location,
                maxNum: match.event.place.maxNumber,
            },
            userId: match.event.userId,
            Topic: match.event.topic,
            id: match.event.id,
            match: {
                sourceEventId: id,
                targetEventId: match.event.id,
                score: match.score
            },
            list: 1 as 0 | 1,
            depth: depth + 1,
        };

        return result;
    }

    const targetEventForDetail = (): SingleEventDisplayElementType | null => {

        const result = {
            dateTime: dateTime,
            duration: duration,
            description: description,
            place: {
                location: place.location,
                maxNum: place.maxNum,
            },
            userId: userId,
            Topic: Topic,
            id: id,
            list: 0 as 0 | 1,
            depth: depth + 1,
            match: match || undefined,
        }

        return result;
    }


    const DeleteEvent = () => {
        setIsDeleting(true);
        handleDeleteEvent(event, (message) => {
            setIsDeleting(false);
            if (message.success === true) {
                onClose();
            } else {
                Alert.alert('删除失败', message.message);
            }
        });
    };

    const signUpEvent = () => {
        console.log("signUpEvent");
        console.log(match);
        if (match?.sourceEventId && match?.targetEventId) {
            handleSignupEvent(match.sourceEventId, match.targetEventId, "I like it", () => { });
        }
        else
        {
            console.log("match is not exist!");
        }
    }

    const handleLeaveEvent = () => {
        
    };

    const handleWithdrawApplication = () => {
        // Implement withdraw application logic here
        // console.log("Withdrawing application for match event:", selectedMatchEvent?.event.id);
    };

    const handleExitMatchEvent = () => {
        // Implement exit logic here
        // console.log("Exiting match event:", selectedMatchEvent?.event.id);
    };

    return (
        <TouchableOpacity onPress={handleEventPress} disabled={list !== 1}>
            <View style={getContainerStyle()}>
                <Text style={styles.title}>{Topic}</Text>

                {/* Add state display */}
                <View style={styles.infoRow}>
                    <Ionicons name="flag-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>状态: {getEventState(currentEvent)}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>{dateTime} (持续 {duration} 小时)</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        经度: {place.location[0]}, 纬度: {place.location[1]}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>最多参与人数: {place.maxNum}</Text>
                </View>

                {description && (
                    <View style={styles.infoRow}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>{description}</Text>
                    </View>
                )}

                {userId && (
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>创建人: {userName}</Text>
                    </View>
                )}

                {match && (
                    <View style={styles.infoRow}>
                        <Ionicons name="star-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>匹配分数: {match.score}</Text>
                    </View>
                )}

                {matchEvents && matchEvents.length > 0 && list !== 1 && depth < 2 && (
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
                                {matchEvents.map(matchEvent => (
                                    <SingleEventDisplay
                                        {...targetEventForMatch(matchEvent)}
                                        depth={depth + 1} // 增加递归深度
                                    />
                                ))}
                            </ScrollView>
                        </FullScreenModal>
                    </View>
                )}

                {list === 0 && (
                    <View style={styles.buttonContainer}>
                        {getEventState(currentEvent) === 'owned' ? (
                            isDeleting ? (
                                <ActivityIndicator size="large" color="#0000ff" />
                            ) : (
                                <Button title="删除事件" onPress={DeleteEvent} disabled={isDeleting} />
                            )
                        ) : getEventState(currentEvent) === 'joined' ? (
                            <Button title="退出事件" onPress={handleLeaveEvent} />
                        ) : getEventState(currentEvent) === 'signup' ? (
                            <Button title="撤回申请" onPress={handleWithdrawApplication} />
                        ) : (
                            <Button title="加入事件" onPress={signUpEvent} />
                        )}
                    </View>
                )}


                <FullScreenModal
                    visible={showEventDetails}
                    onClose={() => setShowEventDetails(false)}
                    title="事件详情"
                >
                    <ScrollView>
                        <SingleEventDisplay
                            {...targetEventForDetail()}
                            depth={depth + 1} // 增加递归深度
                        />
                    </ScrollView>
                </FullScreenModal>
            </View>
        </TouchableOpacity>
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
});


