import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import AddItemModal from '../itemSubmit/addnewItem/addNewItem';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';


export default function TabOneScreen() {
  const [inputs, setInputs] = useState([
    { title: 'name', value: '' },
    { title: 'age', value: '' },
    { title: 'gender', value: '' },
    { title: 'date', value: '' }
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAgeSelecting, setAgeIsSelecting] = useState(false);
  const [isGenderSelecting, setGenderIsSelecting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  // const [selectedNewItem, setSelectedNewItem] = useState('');
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
    console.log("text:", text, "index:", index, "field:", field);
    const newInputs = [...inputs];
    newInputs[index][field] = text;
    setInputs(newInputs);
  };

  const handleDateChange = (event, selectedDate, index) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    handleInputChange(currentDate.toISOString(), index, 'value');
  };

  const addInputField = (title_option) => {
    setInputs([...inputs, { title: title_option, value: '' }]);
  };

  const removeInputField = (index) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };


  const addItem = () => {
    let ischeckok = true;
    const newItems = inputs.reduce((acc, item) => {
      if (item.title.trim() && item.value.trim()) {
        acc[item.title] = item.value;
      }
      else {
        ischeckok = false;
        // how to break at here?
      }
      return acc;
    }, {});

    if (!ischeckok) {
      alert("Please fill all the fields");
      return;
    }

    console.log('newItems:', JSON.stringify(newItems));
    if (Object.keys(newItems).length) {
      ws.current.send(JSON.stringify(newItems));
      setInputs([
        { title: 'name', value: '' },
        { title: 'age', value: '' },
        { title: 'male', value: '' },
        { title: 'date', value: '' }
      ]);
    }
  };

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const isRemoveButtonVisible = (title) => {
    return title !== 'name' && title !== 'age' && title !== "gender" && title !== "date";
  };

  const genderSelect = (index, input) => {

    const handleSelect = (selectedValue) => {
      handleInputChange(selectedValue, index, 'value');
      setGenderIsSelecting(false);
    };

    return (
      <View style={styles.inputContainer}>
        <Text>{input.value}</Text>
        <Button title='修改' onPress={() => setModalVisible(true)} />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={{ marginTop: 22 }}>
            <View>
              <Picker
                selectedValue={input.value}
                onValueChange={(itemValue, itemIndex) => handleSelect(itemValue)}
                style={{ width: '100%' }}
              >
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
              <Button title="Confirm" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const ageSelect = (index, input) => {


    const handleSelect = (selectedValue) => {
      console.log('selectedValue:', selectedValue);
      handleInputChange(selectedValue, index, 'value');
      setAgeIsSelecting(false);
    };

    return (
      <View style={styles.input}>
        <TouchableOpacity onPress={() => setAgeIsSelecting(true)}>
          <Text>{input.value}</Text>
        </TouchableOpacity>
        {isAgeSelecting && (
          <View style={{ flex: 1, flexDirection: "column", zIndex: 1, position: 'absolute', width: '100%' }}>
            <View style={{ flex: 1 }}>
              <Picker
                selectedValue={input.value}
                onValueChange={(itemValue) => handleSelect(itemValue)}
                style={{ width: '100%', height: 200 }} // Increase the height to make the Picker easier to interact with
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((option) => (
                  <Picker.Item key={option} label={option.toString()} value={option.toString()} />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </View>
    );
  };


  //use this function to handle the item select
  const handleItemSelect = (index, item) => {
    //if input title is gender
    console.log("input:", item, "index:", index);
    if (item.title === 'gender') {
      return genderSelect(index, item);
    } else if (item.title === 'age') {
      return ageSelect(index, item);
    } else {
      return (
        <TextInput
          style={styles.input}
          placeholder={`Enter value ${index + 1}`}
          value={item.value}
          onChangeText={(text) => handleInputChange(text, index, 'value')}
        />
      );
    }
  }







  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      {inputs.map((input, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text
            style={styles.title}>
            {input.title}
          </Text>
          {input.title === 'date' ? (
            <>
              <Button title="Choose Time" onPress={() => setShowDatePicker(true)} />
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  is24Hour={true}
                  display="default"
                  onChange={(event, selectedDate) => handleDateChange(event, selectedDate, index)}
                />
              )}
            </>
          ) : handleItemSelect(index, input)}
          {isRemoveButtonVisible(input.title) &&
            <TouchableOpacity style={styles.removeButton} onPress={() => removeInputField(index)}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>}
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <Button title="Submit Items" onPress={addItem} />
        <Button title="Add More Items" onPress={openModal} />
      </View>

      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <AddItemModal onItemSelect={addInputField} onClose={closeModal} />
        </View>
      </Modal>

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
