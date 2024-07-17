import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, FlatList, Modal, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Picker } from '@react-native-picker/picker';
import EventDisplay from '../itemSubmit/eventdisplay';
import { useCurrentLocation } from '../itemSubmit/LocationContext'; // 引入useLocation
import {send,connectWebSocket} from '../context/WebSocketProvider';

export default function TabOneScreen() {
  const [index, setIndex] = useState(1);
  const getLoacationResult = useCurrentLocation();

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

  const refreshPage = () => {
    connectWebSocket();
    setEventList([
      { 'id': '', 'name': '', 'age': '', 'gender': '', 'date': '', 'location': '' }
    ]);
    
  };

  // 根据字段名渲染单元格内容
  const renderItemCell = (item, title) => {
    const value = item[title] || ''; // 如果数据中没有对应字段，则显示为空字符串
    return (
      <View style={styles.cell}>
        <Text style={styles.cellText}>{value}</Text>
      </View>
    );
  };

  const sendFilter = (filterItem) => {
      const jsonmsg = {};
      jsonmsg.type = 'filter';


        console.log('location:', getLoacationResult.currentRegion);
        jsonmsg.location = {
          distance: filterItem.distance,
          location: [getLoacationResult.currentRegion.longitude,getLoacationResult.currentRegion.latitude]
        };
    send(JSON.stringify(jsonmsg));
  }

  const FilterEvents = () => {

    const [modalVisible, setModalVisible] = useState(false);


    const handleFilter = (index) => {
      setIndex(index);
      console.log('index:', index,options[index].value);
      const jsonObj = { 'distance': options[index].value };
      sendFilter(jsonObj);
      setModalVisible(false); // 选择后关闭模态窗口
    };

    
    return (
      <View >
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text>距离：{options[index].label}</Text>
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
            >
              {options.map((option, index) => (
                <Picker.Item key={index} label={option.label} value={index} />
              ))}
            </Picker>
          </View>
        </Modal>
      </View>
    );

  };



  return (
    <View style={styles.container}>
      <Button title='刷新' onPress={refreshPage} />
      {FilterEvents()}
      <EventDisplay eventDetailsArray={eventList} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row', // Arrange titles in a row
    alignItems: 'center', // Optional: center items vertically
    justifyContent: 'center', // Optional: add space between items
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
