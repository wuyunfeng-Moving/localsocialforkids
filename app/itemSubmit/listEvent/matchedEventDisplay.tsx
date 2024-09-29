import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useWebSocket } from '../../context/WebSocketProvider';
import { SingleEventDisplay } from "./singleEventDisplay";
import { Event, Events } from "@/app/types/types";
import comWithServer from '@/app/context/comWithServer';
import BackButton from '@/components/back';

type matchEventElementType = {
    sourceEventId: Number,
    targetEventId: Number,
    score: Number
}

interface MatchedEventDisplayProps {
    currentEvent: Event;
    list: Number;
    match: matchEventElementType;
}

const MatchedEventsDisplay: React.FC<MatchedEventDisplayProps> = ({ currentEvent, list, match }) => {
    const { userEvents, getMatchEvents } = useWebSocket() || {};
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const { handleDeleteEvent, handleSignupEvent, handleCancelSignupEvent } = comWithServer();
   

    const eventWithoutPendingSignUps =(event:Event)=>{
        const { pendingSignUps, ...eventWithoutPendingSignUps } = event;
        return eventWithoutPendingSignUps;
    }

    const handleEventPress = () => {
        setSelectedEvent(currentEvent);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedEvent(null);
    };

    const signUpEvent = () => {
        setIsApplying(true);
        handleSignupEvent(match.sourceEventId, match.targetEventId, "I like it", (success) => {
            if (success) {
                alert("申请成功");
            } else {
                alert("申请失败");
            }
            setIsApplying(false);
        });
    }

    const cancelSignUpEvent = () => {
        setIsApplying(true);
        handleCancelSignupEvent(match.sourceEventId, match.targetEventId, (success) => {
            if (success) {
                alert("取消申请成功");
            } else {
                alert("取消申请失败");
            }
            setIsApplying(false);
        });
    }

    const handleLeaveEvent = () => {
        
    };

    const isEventApplied = currentEvent.pendingSignUps?.some(
        (signup) => signup.sourceEventId === match.sourceEventId
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleEventPress}>
                <SingleEventDisplay currentEvent={eventWithoutPendingSignUps(currentEvent)} list={1} match={match} />
            </TouchableOpacity>



        {/* 单个匹配事件的显示界面，显示内容除了详细事件信息之外，还包括匹配的分数。
            如果match中的sourceEventId已经在currentEvent的申请队列中，则显示撤销申请按钮，并且在点击后，发送cancel消息到服务器，并根据服务器返回的success来显示申请成功或者失败
            如果不在，则显示申请加入按钮，并且在点击后，发送申请消息到服务器，并根据服务器返回的success来显示申请成功或者失败。
        */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <BackButton onPress={closeModal}/>
                    <ScrollView>
                        {selectedEvent && (
                            <>
                                <SingleEventDisplay currentEvent={eventWithoutPendingSignUps(selectedEvent)} list={0} match={match}/>
                                {isEventApplied ? (
                                    <TouchableOpacity style={styles.cancelButton} onPress={cancelSignUpEvent}>
                                        <Text style={styles.buttonText}>撤销申请</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.joinButton} onPress={signUpEvent}>
                                        <Text style={styles.buttonText}>加入活动</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    emptyText: {
        fontStyle: 'italic',
        color: '#888',
    },
    modalContainer: {
        flex: 1,
        padding: 16,
        paddingTop:60,
    },
    joinButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        alignItems: 'center',
    },
    joinButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#f44336',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    matchScore: {
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
    },
});

export default MatchedEventsDisplay;
