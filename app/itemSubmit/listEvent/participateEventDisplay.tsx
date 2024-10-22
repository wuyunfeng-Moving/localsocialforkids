import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Button, ScrollView } from "react-native";
import { useWebSocket } from '../../context/WebSocketProvider';
import { SingleEventDisplay } from "./singleEventDisplay";
import { Event, MatchEvent } from "@/app/types/types";
import { useLocalSearchParams } from 'expo-router';

const ParticipateEventDisplay: React.FC<Event> = () => {
	const params = useLocalSearchParams<{ event: string }>();
	const {comWithServer,getMatchEvents} = useWebSocket();
    const { handleDeleteEvent, handleSignupEvent } = comWithServer;
	const [isDeleting, setIsDeleting] = useState(false);

	const currentEvent:Event = JSON.parse(params.event);

	console.log("para",currentEvent,params);

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
                <Button 
                    title={isDeleting ? "退出中..." : "退出活动"} 
                    onPress={DeleteEvent} 
                    disabled={isDeleting}
                    color="red"
                />
            </View>

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

export default ParticipateEventDisplay;
