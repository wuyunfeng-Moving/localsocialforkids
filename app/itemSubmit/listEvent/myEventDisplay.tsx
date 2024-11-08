import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useWebSocket ,AllEvents} from '../../context/WebSocketProvider';
import { Event } from "@/app/types/types";
import { SingleEventDisplay } from './singleEventDisplay';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

interface MyEventDisplayProps {
  kidEvents: Event[];
  userEvents: Event[];
}

const MyEventDisplay: React.FC<MyEventDisplayProps> = ({ kidEvents, userEvents }) => {
    const AllEvents = useQueryClient().getQueryData(['categorizedEvents']) as AllEvents;

    const handleEventPress = (event: Event) => {
      console.log("handleEventPress", event);
      router.push({
        pathname: '../events/[id]',
        params: { id: event.id, eventData: JSON.stringify(event) }  // 序列化事件对象
      });
    };

    return (
        <View style={styles.container}>
          {AllEvents.created.length > 0 ? (
            AllEvents.created.map((event) => (
              <TouchableOpacity 
                key={event.id}
                onPress={() => handleEventPress(event)}>
                <SingleEventDisplay currentEvent={event} list={1} depth={0} />
              </TouchableOpacity>
            ))
          ) : 
          AllEvents.participating.length > 0 ? (
            AllEvents.participating.map((event) => (
              <TouchableOpacity 
                key={event.id}
                onPress={() => handleEventPress(event)}>
                <SingleEventDisplay currentEvent={event} list={1} depth={0} />
              </TouchableOpacity>
            ))
          ) :
          AllEvents.applied.length > 0 ? (
            AllEvents.applied.map((event) => (
              <TouchableOpacity 
                key={event.id}
                onPress={() => handleEventPress(event)}>
                <SingleEventDisplay currentEvent={event} list={1} depth={0} />
              </TouchableOpacity>
            ))
          ) : (
            <Text>没有活动</Text>
          )}
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default MyEventDisplay;
