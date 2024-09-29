import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useWebSocket } from '../../context/WebSocketProvider';
import { SingleEventDisplay } from "./singleEventDisplay";
import MatchedEventDisplay from './matchedEventDisplay';
import { Event } from "@/app/types/types";
import OwnedEventDisplay from './ownedEventDisplay';
import BackButton from '@/components/back';

const OwnedEventsDisplay: React.FC = () => {
	const { userEvents} = useWebSocket() || {};
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [modalVisible, setModalVisible] = useState(false);

	const handleEventPress = (event: Event) => {
		setSelectedEvent({ ...event});
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setSelectedEvent(null);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>我创建的活动</Text>
			{userEvents && userEvents.length > 0 ? (
				userEvents.map((userEvent: Event) => (
					<TouchableOpacity key={userEvent.id} onPress={() => handleEventPress(userEvent)}>
						<SingleEventDisplay currentEvent={userEvent} list={1} />
					</TouchableOpacity>
				))
			) : (
				<Text style={styles.emptyText}>没有创建的活动</Text>
			)}

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
							<OwnedEventDisplay {...selectedEvent} />
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
		paddingTop: 50, // Increased top padding to accommodate the close button
	},
	closeButton: {
		position: 'absolute',
		top: 60, // Approximately 1cm from the top (assuming 1cm ≈ 40 pixels)
		left: 16,
		zIndex: 1,
	},
	closeButtonText: {
		fontSize: 24, // Slightly increased size for better visibility
	},
});

export default OwnedEventsDisplay;
