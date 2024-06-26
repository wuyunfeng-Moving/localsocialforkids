import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://47.98.112.211:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      //setItems((prevItems) => [...prevItems, message]);
      if (Array.isArray(data)) {
        // If received data is an array, concatenate it to the list
        setItems((prevItems) => [...prevItems, ...data]);
      } else {
        // Otherwise, just add the single item
        setItems((prevItems) => [...prevItems, data]);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const addItem = () => {
    if (text.trim()) {
      ws.current.send(text);
      setText('');
    }
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
        data={items}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">
              {item}
            </Text>
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
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
    alignItems: 'center',
  },
  itemText: {
    textAlign: 'left',
    width: '100%',
  },
});
