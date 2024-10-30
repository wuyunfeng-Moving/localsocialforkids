import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { SingleEventDisplay } from "./singleEventDisplay";
import { Event,Events } from "@/app/types/types";
import BackButton from '@/components/back';
import ParticipateEventDisplay from './participateEventDisplay';
import { useRouter } from 'expo-router';

// 修改组件名称和属性类型
const EventsDisplay: React.FC<{eventType: 'owned' | 'participated',targetEvents:Events}> = ({ eventType,targetEvents }) => {
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	// const [modalVisible, setModalVisible] = useState(false);
	const router = useRouter();

	const handleEventPress = (event: Event) => {
		console.log("handleEventPress", event);
		router.push({
			pathname: '../events/[id]',
			params: { id: event.id, eventData: JSON.stringify(event) }  // 序列化事件对象
		});
	};

	// 根据 eventType 设置标题
	const title = eventType === 'owned' ? '我创建的活动' : '我参与的活动';

	// 根据 eventType 设置空列表提示文本
	const emptyText = eventType === 'owned' ? '没有创建的活动' : '没有参与的活动';

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>
			{targetEvents && targetEvents.length > 0 ? (
				targetEvents.map((event: Event) => (
					<TouchableOpacity key={event.id} onPress={() => handleEventPress(event)}>
						<SingleEventDisplay currentEvent={event} list={1} />
					</TouchableOpacity>
				))
			) : (
				<Text style={styles.emptyText}>{emptyText}</Text>
			)}

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

// 修改导出的组件名称
export default EventsDisplay;
