import { View, Text } from "@/components/Themed";
import { StyleSheet } from "react-native";
import { useWebSocket } from '../../context/WebSocketProvider';
import { SingleEventDisplay, SingleEventDisplayElementType } from "./singleEventDisplay";
import { Event } from "@/app/types/types";
import EventsDisplay from './ownedEventsDisplay';

const myEventDisplay = () => {
    const { kidEvents} = useWebSocket() || {};


    return (
        <View>
            <EventsDisplay eventType="participated"/>
            <EventsDisplay eventType="owned"/>
        </View>
        
    );
};

const myStyle = StyleSheet.create({

});

export default myEventDisplay;
