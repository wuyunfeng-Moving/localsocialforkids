/*this is for display the event detail on the screen */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type EventDetails = {
  name: string | null;
  age: string | null;
  gender: string | null;
  date: string | null;
  location: string | null;
};

const EventDisplay: React.FC<{ eventDetails: EventDetails }> = ({ eventDetails }) => {
  // Helper function to check for null values
  const displayValue = (value: string | null) => value ? value : '--';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{displayValue(eventDetails.name)}</Text>
      <Text style={styles.detail}>Age: {displayValue(eventDetails.age)}</Text>
      <Text style={styles.detail}>Gender: {displayValue(eventDetails.gender)}</Text>
      <Text style={styles.detail}>Date: {displayValue(eventDetails.date)}</Text>
      <Text style={styles.detail}>Location: {displayValue(eventDetails.location)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default EventDisplay;