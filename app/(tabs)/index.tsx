import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import AddItemModal from './addNewItem';

export default function TabOneScreen() {
  const [inputs, setInputs] = useState([
    { title: 'name', value: '' },
    { title: 'age', value: '' },
    { title: 'male', value: '' },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://47.98.112.211:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Message from server:', data);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // return () => {
    //   ws.current.close();
    // };
  }, []);

  const handleInputChange = (text, index, field) => {
    const newInputs = [...inputs];
    newInputs[index][field] = text;
    setInputs(newInputs);
  };

  const addInputField = () => {
    setInputs([...inputs, { title: '', value: '' }]);
  };

  const removeInputField = (index) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  const addItem = () => {
    const newItems = inputs.reduce((acc, item) => {
      if (item.title.trim() && item.value.trim()) {
        acc[item.title] = item.value;
      }
      return acc;
    }, {});

    console.log('newItems:', JSON.stringify(newItems));
    if (Object.keys(newItems).length) {
      ws.current.send(JSON.stringify(newItems));
      setInputs([
        { title: 'name', value: '' },
        { title: 'age', value: '' },
        { title: 'male', value: '' },
      ]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      {inputs.map((input, index) => (
        <View key={index} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Enter title ${index + 1}`}
            value={input.title}
            onChangeText={(text) => handleInputChange(text, index, 'title')}
          />
          <TextInput
            style={styles.input}
            placeholder={`Enter value ${index + 1}`}
            value={input.value}
            onChangeText={(text) => handleInputChange(text, index, 'value')}
          />
          <TouchableOpacity style={styles.removeButton} onPress={() => removeInputField(index)}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <Button title="Submit Items" onPress={addItem} />
        <Button title="Add More Items" onPress={addInputField} />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    width: '100%',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginHorizontal: 5,
  },
  removeButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
});
