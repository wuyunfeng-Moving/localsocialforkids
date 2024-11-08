import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useWebSocket} from '../../context/WebSocketProvider';
import { Event } from "@/app/types/types";
import { SingleEventDisplay } from './singleEventDisplay';
import { router } from 'expo-router';

const MyEventDisplay: React.FC = () => {
    const { userEvents, kidEvents, appliedEvents } = useWebSocket();

    const handleEventPress = (event: Event) => {
      console.log("handleEventPress", event);
      router.push({
        pathname: '../events/[id]',
        params: { id: event.id, eventData: JSON.stringify(event) }  // 序列化事件对象
      });
    };

    return (
        <View style={styles.container}>
          {userEvents.length > 0 ? (
            userEvents.map((event) => (
              <TouchableOpacity 
                key={event.id}
                onPress={() => handleEventPress(event)}>
                <SingleEventDisplay currentEvent={event} list={1} depth={0} />
              </TouchableOpacity>
            ))
          ) : 
          kidEvents.length > 0 ? (
            kidEvents.map((event) => (
              <TouchableOpacity 
                key={event.id}
                onPress={() => handleEventPress(event)}>
                <SingleEventDisplay currentEvent={event} list={1} depth={0} />
              </TouchableOpacity>
            ))
          ) :
          appliedEvents.length > 0 ? (
            appliedEvents.map((event) => (
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
