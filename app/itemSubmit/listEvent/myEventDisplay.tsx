import { View,Text } from "@/components/Themed";
import { StyleSheet } from "react-native";
import EventDisplay from './EventListDisplay';
import { useWebSocket } from '../../context/WebSocketProvider';

const myEventDisplay = () => {
    const { userInfo, matchedEvents, orderToServer, kidEvents, userEvents } = useWebSocket() || {};

    return (
        <View>
            <Text>我创建的活动</Text>
            {userEvents && userEvents.length > 0 ? (
                <EventDisplay eventDetailsArray={userEvents} sourceEventId={null} />
            ) : (
                <Text>没有创建的活动</Text>
            )}
            {kidEvents && kidEvents.length > 0 ? (
                <EventDisplay eventDetailsArray={kidEvents} sourceEventId={null} />
            ) : (
                <Text>没有参加的活动</Text>
            )}
        </View>
    );
};

const myStyle = StyleSheet.create({

});

export default myEventDisplay;
