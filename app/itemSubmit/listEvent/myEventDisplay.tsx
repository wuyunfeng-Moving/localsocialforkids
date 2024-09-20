import { View, Text } from "@/components/Themed";
import { StyleSheet } from "react-native";
import { useWebSocket } from '../../context/WebSocketProvider';
import { SingleEventDisplay, SingleEventDisplayElementType } from "./singleEventDisplay";
import { Event } from "@/app/types/types";

const myEventDisplay = () => {
    const { userInfo, matchedEvents, orderToServer, kidEvents, userEvents } = useWebSocket() || {};

    const targetEventForUser = (event: Event): SingleEventDisplayElementType | null => {
        if (!event) return null;
        return {
            dateTime: event.dateTime || '',
            duration: event.duration || 0,
            description: event.description || '',
            place: {
                location: event.place?.location || [0, 0],
                maxNum: event.place?.maxNumber || 0,
            },
            userId: event.userId || 0,
            Topic: event.topic || '',
            id: event.id || 0,
            list: 1,
            depth: 0,
            kidIds: event.kidIds || [],
        };
    };

    return (
        <View>
            <Text>我创建的活动</Text>
            {userEvents && userEvents.length > 0 ? (
                userEvents.map((userEvent: Event) => {
                    const eventProps = targetEventForUser(userEvent);
                    return eventProps && <SingleEventDisplay key={eventProps.id} {...eventProps} />;
                })
            ) : (
                <Text>没有创建的活动</Text>
            )}
            <Text>我参与的活动</Text>
            {kidEvents && kidEvents.length > 0 ? (
                kidEvents.map((kidEvent: Event) => {
                    const eventProps = targetEventForUser(kidEvent);
                    return eventProps && <SingleEventDisplay key={eventProps.id} {...eventProps} />;
                })
            ) : (
                <Text>没有参加的活动</Text>
            )}
        </View>
    );
};

const myStyle = StyleSheet.create({

});

export default myEventDisplay;
