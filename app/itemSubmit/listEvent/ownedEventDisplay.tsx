import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Button, ScrollView } from "react-native";
import { useWebSocket } from '../../context/WebSocketProvider';
import { SingleEventDisplay } from "./singleEventDisplay";
import MatchedEventDisplay from './matchedEventDisplay';
import { Event, MatchEvent } from "@/app/types/types";
import BackButton from '@/components/back';

const OwnedEventDisplay: React.FC<Event> = (currentEvent) => {
    const {getMatchEvents,comWithServer} = useWebSocket();
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
    const matchEvents:MatchEvent[] = getMatchEvents(currentEvent.id);
    const { handleDeleteEvent, handleSignupEvent } = comWithServer;
	const [isDeleting, setIsDeleting] = useState(false);

	const handleEventPress = () => {
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setSelectedEvent(null);
	};

    const DeleteEvent = () => {
        setIsDeleting(true);
        handleDeleteEvent(currentEvent, (message) => {
            setIsDeleting(false);
            if (message.success === true) {
                // You might want to handle successful deletion here
                // For example, you could close the modal or update the parent component
                closeModal();
            } else {
                alert('删除失败', message.message);
            }
        });
    };

	return (
		<View style={styles.container}>
			<SingleEventDisplay currentEvent={currentEvent} list={0} depth={0}/>
            <View style={styles.buttonContainer}>
                {matchEvents && matchEvents.length > 0 && (
                    <Button title="获取匹配" onPress={handleEventPress} />
                )}
                <Button 
                    title={isDeleting ? "删除中..." : "删除事件"} 
                    onPress={DeleteEvent} 
                    disabled={isDeleting}
                    color="red"
                />
            </View>


            {/* 
            匹配事件的进入界面，在用户点击获取匹配后，并且查询到存在匹配事件后，进入该界面。
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
});

export default OwnedEventDisplay;
