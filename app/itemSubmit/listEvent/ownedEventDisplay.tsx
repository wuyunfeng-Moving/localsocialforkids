import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Button, ScrollView } from "react-native";
import { useWebSocket } from '../../context/WebSocketProvider';
import { SingleEventDisplay } from "./singleEventDisplay";
import MatchedEventDisplay from './matchedEventDisplay';
import { Event, MatchEvent } from "@/app/types/types";
import BackButton from '@/components/back';
import { useLocalSearchParams } from 'expo-router';

const OwnedEventDisplay: React.FC = () => {
    const params = useLocalSearchParams<{ event: string }>();
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const { getMatchEvents, comWithServer } = useWebSocket();
    const [modalVisible, setModalVisible] = useState(false);
    const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
    const { handleDeleteEvent } = comWithServer;
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof params.event === 'string') {
            try {
                const eventData: Event = JSON.parse(params.event);
                setCurrentEvent(eventData);
                if (eventData.id) {
                    setMatchEvents(getMatchEvents(eventData.id));
                }
                console.log('Processed event data:', JSON.stringify(eventData, null, 2));
            } catch (e) {
                console.error('Error parsing event string:', e);
                setError('Invalid event data (parsing failed)');
            }
        } else {
            setError('Invalid event data (not a string)');
        }
    }, [params.event, getMatchEvents]);

    const handleEventPress = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const DeleteEvent = () => {
        if (!currentEvent) return;
        setIsDeleting(true);
        handleDeleteEvent(currentEvent, (message) => {
            setIsDeleting(false);
            if (message.success === true) {
                // Handle successful deletion
                alert('事件已成功删除');
                // You might want to navigate back to the previous screen here
            } else {
                alert('删除失败: ' + message.message);
            }
        });
    };

    if (error) {
        return <Text style={styles.errorText}>{error}</Text>;
    }

    if (!currentEvent) {
        return <Text style={styles.emptyText}>No event data available</Text>;
    }

    return (
        <View style={styles.container}>
            <SingleEventDisplay currentEvent={currentEvent} list={0} depth={0} />
            <View style={styles.buttonContainer}>
                {matchEvents.length > 0 && (
                    <Button title="获取匹配" onPress={handleEventPress} />
                )}
                <Button 
                    title={isDeleting ? "删除中..." : "删除事件"} 
                    onPress={DeleteEvent} 
                    disabled={isDeleting}
                    color="red"
                />
            </View>

            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <BackButton onPress={closeModal} />
                    <ScrollView>
                        {matchEvents.map((matchEvent) => (
                            <MatchedEventDisplay 
                                key={matchEvent.event.id}
                                currentEvent={matchEvent.event} 
                                list={1} 
                                match={{
                                    sourceEventId: currentEvent.id,
                                    targetEventId: matchEvent.event.id,
                                    score: matchEvent.score
                                }}
                            />
                        ))}
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
		paddingTop: 60, // Increased top padding for the close button
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	closeButton: {
		position: 'absolute',
		top: 60, // Moved down by 1cm (approximately 40 pixels)
		left: 16,
		zIndex: 1,
	},
	closeButtonText: {
		fontSize: 16,
		color: 'blue', // Added color for better visibility
	},
	errorText: {
		color: 'red',
		fontStyle: 'italic',
		textAlign: 'center',
		marginTop: 20,
	},
});

export default OwnedEventDisplay;
