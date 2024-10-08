import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';
import EventsDisplay from './ownedEventsDisplay';
import { Event } from "@/app/types/types";

interface MyEventDisplayProps {
  kidEvents: Event[];
  userEvents: Event[];
}

const MyEventDisplay: React.FC<MyEventDisplayProps> = ({ kidEvents, userEvents }) => {
  const { isEventBelongToUser, isParticipateEvent } = useWebSocket();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <EventsDisplay 
          eventType="participated" 
          targetEvents={kidEvents.filter(event => isParticipateEvent(event))}
        />
      </View>
      
      <View style={styles.section}>
        <EventsDisplay 
          eventType="owned" 
          targetEvents={userEvents.filter(event => isEventBelongToUser(event.userId))}
        />
      </View>
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
