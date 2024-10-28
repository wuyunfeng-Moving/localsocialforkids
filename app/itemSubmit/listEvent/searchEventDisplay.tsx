import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useWebSocket } from "@/app/context/WebSocketProvider";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCurrentLocation } from '../../context/LocationContext';
import LocationPickerModal from '../setLocation';
import { SingleEventDisplay } from './singleEventDisplay';
import { useRouter } from 'expo-router';
import { UserInfo } from '@/app/types/types';

const SearchEventsDisplay = () => {
  const { searchEvents, userInfo } = useWebSocket() || {};
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 2)));
  const { currentRegion, refreshLocation } = useCurrentLocation();
  const [radius, setRadius] = useState('3');
  // const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const router = useRouter();
  const [isLocationAvailable, setIsLocationAvailable] = useState(false);

  useEffect(() => {
    if (currentRegion) {
      setSelectedLocation({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      });
      setIsLocationAvailable(true);
    }
  }, [currentRegion]);

  const handleSelectLocation = useCallback((location) => {
    setSelectedLocation(location);
    // setUseCurrentLocation(false);
  }, []);

  const handleSearch = async () => {
    let locationToUse;
    if (1) {
      if (!currentRegion) {
        await refreshLocation();
      }
      if (currentRegion) {
        // 反转位置数组
        locationToUse = [currentRegion.longitude, currentRegion.latitude];
      } else {
        console.error('Failed to get current location');
        return;
      }
    } else if (selectedLocation) {
      // 反转位置数组
      locationToUse = [selectedLocation.longitude, selectedLocation.latitude];
    } else {
      console.error('No location selected');
      return;
    }

    const searchParams = {
      keyword: keyword || undefined,
      startDate: startDate.toISOString() || undefined,
      endDate: endDate.toISOString() || undefined,
      location: locationToUse,
      radius: radius ? Number(radius) : undefined,
    };
    searchEvents.search(searchParams);
  };

  const onChangeStartDate = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
    // Update end date to be 2 days after the new start date
    setEndDate(new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000));
  };

  const onChangeEndDate = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(currentDate);
  };

  const handleEventPress = (event) => {
    router.push({
      pathname: `../events/${event.id}`,
      params: { eventData: JSON.stringify(event) }
    });
  };

  const filteredEvents = searchEvents.results.filter(event => {
    // Check if the event was not created by the current user
    const notCreatedByUser = event.userId !== userInfo.id;
    
    // Check if none of the user's children are participating
    const noChildrenParticipating = !event.kidIds.some(kidId => 
      userInfo.kidinfo.some(child => child.id === kidId)
    );

    return notCreatedByUser && noChildrenParticipating;
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Search Events</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Keyword"
        value={keyword}
        onChangeText={setKeyword}
      />

      <View style={styles.dateContainer}>
        <Button onPress={() => setShowStartDatePicker(true)} title="Start Date" />
        <Text>{startDate.toLocaleDateString()}</Text>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode={'date'}
            display="default"
            onChange={onChangeStartDate}
          />
        )}
      </View>

      <View style={styles.dateContainer}>
        <Button onPress={() => setShowEndDatePicker(true)} title="End Date" />
        <Text>{endDate.toLocaleDateString()}</Text>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode={'date'}
            display="default"
            onChange={onChangeEndDate}
          />
        )}
      </View>

      <View style={styles.locationContainer}>
        <Text>Use Current Location</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputText}>
          {1
            ? currentRegion
              ? `${currentRegion.latitude.toFixed(4)}, ${currentRegion.longitude.toFixed(4)}`
              : 'Loading current location...'
            : selectedLocation
              ? `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
              : 'No location selected'}
        </Text>
        <TouchableOpacity style={styles.editButton} onPress={() => setLocationModalVisible(true)}>
          <Text style={styles.editButtonText}>Select Location</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Radius (km)"
        value={radius}
        onChangeText={setRadius}
        keyboardType="numeric"
      />

      <TouchableOpacity 
        style={[styles.searchButton, !isLocationAvailable && styles.disabledButton]} 
        onPress={handleSearch}
        disabled={!isLocationAvailable}
      >
        <Text style={styles.buttonText}>
          {isLocationAvailable ? 'Search' : 'Waiting for location...'}
        </Text>
      </TouchableOpacity>

      {searchEvents.isSearching && <Text>Searching...</Text>}
      {searchEvents.searchError && <Text>Error: {searchEvents.searchError.message}</Text>}

      {!searchEvents.isSearching && filteredEvents.length === 0 && (
        <Text style={styles.noResultsText}>No eligible events found matching your search criteria.</Text>
      )}

      {filteredEvents.map((event, index) => (
        <TouchableOpacity key={event.id} onPress={() => handleEventPress(event)}>
          <SingleEventDisplay currentEvent={event} />
        </TouchableOpacity>
      ))}

      <LocationPickerModal
        isVisible={isLocationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleSelectLocation}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventItem: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noResultsText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  editButton: {
    marginLeft: 10,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
});

export default SearchEventsDisplay;
