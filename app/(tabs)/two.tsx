import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [titles, setTitles] = useState(['name','age','male']);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://47.98.112.211:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log("received data: ", data)

      // if (titles.length === 0 && data.length > 0) {
      //   // Use the first message to set titles
      //   const firstMessage = data[0];
      //   const newTitles = Object.keys(firstMessage);
      //   setTitles(newTitles);
      // }

      if (Array.isArray(data)) {
        setItems((prevItems) => [...prevItems, ...data]);
      } else {
        setItems((prevItems) => [...prevItems, data]);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, [titles]);

  const addItem = () => {
    if (text.trim()) {
      ws.current.send(text);
      setText('');
    }
  };

  return (
    <View style={styles.container}>

      <FlatList
        data={items}
        keyExtractor={(item, index) => index.toString()}
        
        ListHeaderComponent={() => (
          <View style={styles.listItem}>
            {titles.map((title, index) => (
              <Text key={index} style={styles.headerText,{width: 200}} numberOfLines={1} ellipsizeMode="tail">
                {title}
              </Text>
            ))}
          </View>
        )}

        renderItem={({ item }) => (
          <View style={styles.listItem}>
            {titles.map((title, index) => (
              <Text key={index} style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">
                {item[title]}
              </Text>
            ))}
          </View>
        )}
      />

<Text style={styles.title}>Tab One</Text>
<View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <TextInput
        style={styles.input}
        placeholder="Enter an item"
        value={text}
        onChangeText={setText}
      />
      <Button title="Add Item" onPress={addItem} />
    
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
    flexDirection: 'row', // Add this line to arrange titles in a row
    alignItems: 'center', // Optional: center the items vertically
    justifyContent: 'space-between', // Optional: add space between items
    borderBottomColor: '#ccc',
    width: '100%',
    // alignItems: 'center',
  },
  itemText: {
    textAlign: 'left',
    width: '100%',
  },
  headerText: {
    marginHorizontal: 50, // Adjust this value as needed to create spacing between titles
    // Your existing styles for headerText
    flex: 1,
    textAlign: 'center',
    width: '100%',
  },
});
