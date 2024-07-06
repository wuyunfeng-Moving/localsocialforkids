import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const [text, setText] = useState('');
  const [items, setItems] = useState([
    { 'id': '1', 'name': '2', 'age': '3', 'gender': 'male', 'date': '', 'location': '' }
  ]);
  const titles = ['age', 'name', 'gender', 'date', 'location'];
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://47.98.112.211:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("received data: ", data, '\n', "ori_items: ", items, '\n');
      //check if the received data is already in the items
      //data is a array, so we need to check each element in the array
      //if the data is not in the items, then add it to the items
      data.map((item) => {
        setItems(prevItems => [...prevItems, item]);
      })
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, []);

  useEffect(() => {
    console.log('use effect items: ', items, '\n');
  }, [items]);



  const addItem = () => {
    if (text.trim()) {
      ws.current.send(text);
      setText('');
    }
  };

  // 根据字段名渲染单元格内容
  const renderItemCell = (item, title) => {
   // console.log("in renderItemCell, the item: ", item[0],'\n');
    // const itemsArray = JSON.parse(item);
    // console.log("in renderItemCell, the itemsArray: ", itemsArray,'\n');
    //const value = itemsArray[0][title] || ''; // 如果数据中没有对应字段，则显示为空字符串
    //WAHT IS THE type of item??
    // const json_item = JSON.parse(item);
     const value = item[title] || ''; // 如果数据中没有对应字段，则显示为空字符串
    //console.log("in renderItemCell, the value: ", value, "the title:",title,"the item:",item,'\n');
    return (
      <View style={styles.cell}>
        <Text style={styles.cellText}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <TextInput
        style={styles.input}
        placeholder="Enter an item"
        value={text}
        onChangeText={setText}
      />
      <Button title="Add Item" onPress={addItem} />

      <FlatList
        data={items} // Add an empty object to ensure at least one empty form is displayed
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            {titles.map((title) => (
              <View key={title} style={styles.columnHeader}>
                {<Text>{title.toUpperCase()}</Text>}
                {renderItemCell(item, title)}
              </View>
            ))}
          </View>
        )}
      />
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
    justifyContent: 'space-between', // Optional: add space between items
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
});
