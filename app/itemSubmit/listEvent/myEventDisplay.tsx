import { View, Text } from "@/components/Themed";
import { StyleSheet } from "react-native";
import { useWebSocket } from '../../context/WebSocketProvider';
import { SingleEventDisplay, SingleEventDisplayElementType } from "./singleEventDisplay";
import { Event } from "@/app/types/types";
import OwnedEventsDisplay from './ownedEventsDisplay';

const myEventDisplay = () => {
    const { kidEvents} = useWebSocket() || {};


    return (
        <View>
            <OwnedEventsDisplay/>
            <Text>我参与的活动</Text>
            {kidEvents && kidEvents.length > 0 ? (
                kidEvents.map((kidEvent: Event) => {
                    return <SingleEventDisplay currentEvent={kidEvent} list ={1} />;
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
