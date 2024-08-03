import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Button, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Picker } from '@react-native-picker/picker';
import EventDisplay from '../itemSubmit/eventdisplay';
import { useCurrentLocation } from '../itemSubmit/LocationContext';
import { useWebSocket } from '../context/WebSocketProvider';

export default function TabOneScreen() {
  const { send, connectWebSocket } = useWebSocket();
  const [index, setIndex] = useState(1);
  const getLoacationResult = useCurrentLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [eventList, setEventList] = useState([
    { 'id': '', 'name': '', 'age': '', 'gender': '', 'date': '', 'location': '' }
  ]);

  const options = [
    { label: '1公里', value: 1000 },
    { label: '3公里', value: 3000 },
    { label: '5公里', value: 5000 },
    { label: '10公里', value: 10000 },
    { label: '50公里', value: 50000 },
    { label: '不限', value: 1000000 }
  ];

  useEffect(() => {
    console.log('use effect items: ', eventList, '\n');
  }, [eventList]);

  useEffect(() => {
    if (getLoacationResult && getLoacationResult.currentRegion) {
      console.log('Location available:', getLoacationResult.currentRegion);
      setIsLoading(false);
    } else {
      console.log('Waiting for location...');
      setIsLoading(true);
    }
  }, [getLoacationResult]);

  const refreshPage = useCallback(() => {
    setIsRefreshing(true);
    connectWebSocket();
    setEventList([
      { 'id': '', 'name': '', 'age': '', 'gender': '', 'date': '', 'location': '' }
    ]);
    // 模拟网络请求
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [connectWebSocket]);

  const sendFilter = useCallback((filterItem) => {
    const jsonmsg = {
      type: 'filter',
      location: {
        distance: filterItem.distance,
      }
    };

    if (getLoacationResult && getLoacationResult.currentRegion) {
      console.log('location:', getLoacationResult.currentRegion);
      jsonmsg.location.coordinates = [
        getLoacationResult.currentRegion.longitude,
        getLoacationResult.currentRegion.latitude
      ];
    } else {
      console.log('Location not available');
    }

    send(JSON.stringify(jsonmsg));
  }, [getLoacationResult, send]);

  const FilterEvents = useCallback(() => {
    const [modalVisible, setModalVisible] = useState(false);
    const locationAvailable = getLoacationResult && getLoacationResult.currentRegion;

    const handleFilter = (selectedIndex) => {
      setIndex(selectedIndex);
      console.log('index:', selectedIndex, options[selectedIndex].value);
      sendFilter({ distance: options[selectedIndex].value });
      setModalVisible(false);
    };

    return (
      <View>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          disabled={!locationAvailable}
        >
          <Text>
            距离：{locationAvailable ? options[index].label : '等待位置信息...'}
          </Text>
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalView}>
            <Picker
              selectedValue={index}
              onValueChange={handleFilter}
              style={{ width: 200 }}
            >
              {options.map((option, idx) => (
                <Picker.Item key={idx} label={option.label} value={idx} />
              ))}
            </Picker>
            <Button title="关闭" onPress={() => setModalVisible(false)} />
          </View>
        </Modal>
      </View>
    );
  }, [getLoacationResult, index, options, sendFilter]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title='刷新' onPress={refreshPage} disabled={isRefreshing} />
      {isRefreshing ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <FilterEvents />
          <EventDisplay eventDetailsArray={eventList} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    width: '80%',
    marginVertical: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: '#ccc',
    width: '100%',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  label: {
    marginRight: 10,
    fontWeight: 'bold',
    width: 100,
  },
  columnHeader: {
    flex: 1,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cellText: {
    textAlign: 'center',
  },
});