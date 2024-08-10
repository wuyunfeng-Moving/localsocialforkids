import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useWebSocket } from '../../context/WebSocketProvider';
import { useCurrentLocation } from '../../context/LocationContext';
import DistancePicker from './condition/distance';



export const useFilterManager = () => {
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eventList, setEventList] = useState([]);

  const { send, events } = useWebSocket();
  const { currentRegion, refreshLocation } = useCurrentLocation();

  useEffect(() => {
    console.log('Received events:', JSON.stringify(events, null, 2));
    setEventList(events);
  }, [events]);

  const handleDistanceChange = useCallback((distance) => {
    console.log("Distance selected:", distance);
    setSelectedDistance(distance);
  }, []);

  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setStartDate(currentDate);
    if (currentDate > endDate) {
      setEndDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setEndDate(currentDate);
    if (currentDate < startDate) {
      setStartDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const refreshPage = useCallback(() => {
    setIsRefreshing(true);

    const filterMessage = {
      type: 'filter',
      location: {}
    };

    if (selectedDistance !== null) {
      console.log('Selected distance:', selectedDistance);
      filterMessage.distance = selectedDistance;
    } else {
      console.log('No distance selected');
    }

    if (currentRegion) {
      console.log('Current location:', currentRegion);
      filterMessage.location = [
        currentRegion.longitude,
        currentRegion.latitude
      ];
    } else {
      console.log('No location available');
    }

    if (startDate) {
      filterMessage.startDate = startDate.toISOString();
    }

    if (endDate) {
      filterMessage.endDate = endDate.toISOString();
    }

    console.log('Sending filter message:', JSON.stringify(filterMessage));
    send(filterMessage);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [selectedDistance, currentRegion, send, startDate, endDate]);

  const handleRefreshLocation = useCallback(async () => {
    await refreshLocation();
  }, [refreshLocation]);

  return {
    selectedDistance,
    startDate,
    endDate,
    isRefreshing,
    eventList,
    handleDistanceChange,
    onStartDateChange,
    onEndDateChange,
    refreshPage,
    handleRefreshLocation
  };
};

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <View style={styles.datePickerContainer}>
      <TouchableOpacity onPress={() => setShowStartPicker(true)}>
        <Text>开始时间: {startDate.toLocaleString()}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(Platform.OS === 'ios');
            onStartDateChange(event, selectedDate);
          }}
        />
      )}
      <TouchableOpacity onPress={() => setShowEndPicker(true)}>
        <Text>结束时间: {endDate.toLocaleString()}</Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(Platform.OS === 'ios');
            onEndDateChange(event, selectedDate);
          }}
        />
      )}
    </View>
  );
};

export const FilterCondition = ({ onFilterChange }) => {
  const {
    selectedDistance,
    startDate,
    endDate,
    isRefreshing,
    eventList,
    handleDistanceChange,
    onStartDateChange,
    onEndDateChange,
    refreshPage,
    handleRefreshLocation
  } = useFilterManager();

  const { currentRegion } = useCurrentLocation();

  useEffect(() => {
    const filterState = {
      selectedDistance,
      startDate,
      endDate,
      isRefreshing,
      eventList,
      refreshPage,
      handleRefreshLocation
    };
    onFilterChange(filterState);
  }, [selectedDistance, startDate, endDate, isRefreshing, eventList, refreshPage, handleRefreshLocation, onFilterChange]);

  return (
    <View style={styles.container}>
          <Button title="刷新位置" onPress={handleRefreshLocation} />
      <Text>Current Location: {currentRegion ? 
        `${currentRegion.latitude.toFixed(4)}, ${currentRegion.longitude.toFixed(4)}` : 
        'Not available'}
      </Text>
      <DistancePicker onDistanceChange={handleDistanceChange} selectedDistance={selectedDistance} />
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />
      <Button title='刷新' onPress={refreshPage} disabled={isRefreshing} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  pickerContainer: {
    marginBottom: 10,
  },
  datePickerContainer: {
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  picker: {
    width: '100%',
  },
  closeButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 10,
  },
});