import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import EventDisplay from '../itemSubmit/eventdisplay';

export default function TabOneScreen() {
  const [text, setText] = useState('');
  const [eventList, setEventList] = useState([
    { 'id': '', 'name': '', 'age': '', 'gender': '', 'date': '', 'location': '' }
  ]);
  const ws = useRef(null);

  const initializeWebSocket = () => {
    ws.current = new WebSocket('ws://47.98.112.211:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("received data: ", data, '\n', "ori_items: ", eventList, '\n');
      // Clear the existing items and set the new ones
      setEventList(data);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
  };

  useEffect(() => {
    initializeWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    console.log('use effect items: ', eventList, '\n');
  }, [eventList]);

  const refreshPage = () => {
    if (ws.current) {
      ws.current.close();
    }
    setEventList([
      { 'id': '', 'name': '', 'age': '', 'gender': '', 'date': '', 'location': '' }
    ]);
    initializeWebSocket();
  };

  const addItem = () => {
    if (text.trim()) {
      ws.current.send(text);
      setText('');
    }
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

  return (
    <View style={styles.container}>
      <Button title='筛选' onPress={refreshPage}/>

      <EventDisplay eventDetailsArray={eventList}/>
        
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
