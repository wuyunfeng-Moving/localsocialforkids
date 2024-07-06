import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

type EventDetails = {
  name: string | null;
  age: string | null;
  gender: string | null;
  date: string | null;
  location: string | null;
  id: string | null;
};

const EventDisplay: React.FC<{ eventDetailsArray: EventDetails[] }> = ({ eventDetailsArray }) => {
  // Helper function to check for null values
  const displayValue = (value: string | null) => (value ? value : '--');

  const renderEvent = ({ item }: { item: EventDetails }) => (
    <View style={styles.container}>
      <Text style={styles.title}>{displayValue(item.name)}</Text>
      <Text style={styles.detail}>Age: {displayValue(item.age)}</Text>
      <Text style={styles.detail}>Gender: {displayValue(item.gender)}</Text>
      <Text style={styles.detail}>Date: {displayValue(item.date)}</Text>
      <Text style={styles.detail}>Location: {displayValue(item.location)}</Text>
      <Text style={styles.detail}>ID: {displayValue(item.id)}</Text>
    </View>
  );

  return (
    <FlatList
      data={eventDetailsArray}
      renderItem={renderEvent}
      keyExtractor={(item, index) => index.toString()}
    />
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
    marginBottom: 10,
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
