import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { FilterCondition } from '../itemSubmit/listEvent/filterCondition';
import EventDisplay from '../itemSubmit/listEvent/eventdisplay';

export default function TabOneScreen() {
  const [filterState, setFilterState] = useState({
    selectedDistance: null,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isRefreshing: false,
    eventList: [],
    refreshPage: () => {}
  });

  const handleFilterChange = useCallback((newFilterState) => {
    setFilterState(prevState => ({ ...prevState, ...newFilterState }));
  }, []);

  return (
    <View style={styles.container}>
      <FilterCondition onFilterChange={handleFilterChange} />
      {filterState.isRefreshing ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {filterState.eventList.length > 0 ? (
            <EventDisplay eventDetailsArray={filterState.eventList} />
          ) : (
            <Text style={styles.noEventsText}>没有找到符合条件的活动</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  noEventsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});