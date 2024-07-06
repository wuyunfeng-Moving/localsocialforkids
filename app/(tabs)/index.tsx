import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import AddItemModal from '../itemSubmit/addnewItem/addNewItem';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import LocationPickerModal from '../itemSubmit/setLocation';


export default function TabOneScreen() {
  const [inputs, setInputs] = useState([
    { title: 'name', value: '小吴' },
    { title: 'age', value: '3' },
    { title: 'gender', value: '男' },
    { title: 'date', value: new Date().toDateString() },
    { title: 'location', value: '' }
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDateTimeSelecting, setDateTimeSelecting] = useState(false);
  const [isAgeSelecting, setAgeIsSelecting] = useState(false);
  const [isGenderSelecting, setGenderIsSelecting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  // const [selectedNewItem, setSelectedNewItem] = useState('');
  const ws = useRef(null);

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    // 这里可以处理位置信息，例如更新状态或发送到服务器
    //add to the input
    handleInputChange(`${location.latitude}, ${location.longitude}`, 'location', 'value');
    console.log('Selected Location:', location);
  };

  const initializeWebSocket = () => {
    ws.current = new WebSocket('ws://47.98.112.211:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };
  };

  const refreshPage = () => {
  
    if (ws.current) {
      ws.current.close();
    }

    initializeWebSocket();
  }

  useEffect(() => {
    initializeWebSocket();

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

  const handleInputChange = (text, title, field) => {
    console.log("text:", text, "index:", index, "field:", field);
    const newInputs = [...inputs];
    //look up the inputs array to get the index of title
    const index = newInputs.findIndex((input) => input.title === title);
    //check if the index is valid
    if (index === -1) {
      return;
    }
    newInputs[index][field] = text;
    setInputs(newInputs);
  };

  const handleDateChange = (event, selectedDate, index) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    handleInputChange(currentDate.toISOString(), 'date', 'value');
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
      console.log('sending data:', JSON.stringify(newItems));
      ws.current.send(JSON.stringify(newItems));
      // setInputs([
      //   { title: 'name', value: '' },
      //   { title: 'age', value: '' },
      //   { title: 'male', value: '' },
      //   { title: 'date', value: '' }
      // ]);
    }
  };

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const isRemoveButtonVisible = (title) => {
    return title !== 'name' && title !== 'age' && title !== "gender" && title !== "date" && title !== "location";
  };

  const genderSelect = (index, input) => {

    const handleSelect = (selectedValue) => {
      handleInputChange(selectedValue, 'gender', 'value');
      setGenderIsSelecting(false);
    };

    return (
      <View style={styles.inputContainer}>
        <Text style={{ width: 75, textAlign: 'center' }}>{input.value}</Text>
        <Button title='修改' onPress={() => setGenderIsSelecting(true)} />
        <Modal
          animationType="slide"
          transparent={true}
          visible={isGenderSelecting}
          onRequestClose={() => {
            setGenderIsSelecting(!isGenderSelecting);
          }}
        >
          <View style={{ marginTop: 22 }}>
            <View>
              <Picker
                selectedValue={input.value}
                onValueChange={(itemValue, itemIndex) => handleSelect(itemValue)}
                style={{ width: '100%' }}
              >
                <Picker.Item label="男" value="male" />
                <Picker.Item label="女" value="female" />
              </Picker>
              <Button title="Confirm" onPress={() => setGenderIsSelecting(false)} />
            </View>
          </View>
        </Modal>
      </View>
    );
  };


  const ageSelect = (index, input) => {
    const handleSelect = (selectedValue) => {
      handleInputChange(selectedValue, 'age', 'value');
      setAgeIsSelecting(false);
    };

    return (
      <View style={styles.inputContainer}>
        <Text style={{ width: 75, textAlign: 'center' }}>{input.value}</Text>
        <Button title='修改' onPress={() => setAgeIsSelecting(true)} />
        <Modal
          animationType="slide"
          transparent={true}
          visible={isAgeSelecting}
          onRequestClose={() => {
            setAgeIsSelecting(!isAgeSelecting);
          }}
        >
          <View style={{ marginTop: 22 }}>
            <View>
              <Picker
                selectedValue={input.value}
                onValueChange={(itemValue, itemIndex) => handleSelect(itemValue)}
                style={{ width: '100%' }}
              >
                {/* 假设年龄范围是1-100 */}
                {Array.from({ length: 100 }, (_, i) => (
                  <Picker.Item label={`${i + 1}`} value={`${i + 1}`} key={i} />
                ))}
              </Picker>
              <Button title="Confirm" onPress={() => setAgeIsSelecting(false)} />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const dateSelect = (index, input) => {
    // 将字符串日期转换为Date对象，确保DateTimePicker可以正确处理
    const initialDate = new Date();

    const handleSelect = (selectedDate) => {
      // 将选中的日期转换为字符串格式，如果需要其他格式请相应调整
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const time = selectedDate.toTimeString().split(' ')[0].substring(0, 5);
      handleInputChange(`${formattedDate} ${time}`, 'date', 'value');
      setDateTimeSelecting(false);
    };

    return (
      <View style={styles.inputContainer}>
        <Text style={{ width: 200, textAlign: 'center' }}>{input.value}</Text>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isDateTimeSelecting}
          onRequestClose={() => {
            setDateTimeSelecting(!isDateTimeSelecting);
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', padding: 50, borderRadius: 10, width: '80%', alignItems: 'center' }}>
              <DateTimePicker
                value={initialDate} // 使用Date对象作为value
                mode="datetime" // 修改为datetime以支持日期和时间的选择
                display="default" // 根据需要选择展示模式
                onChange={(event, selectedDate) => {
                  if (event.type === 'set') { // 如果用户选择了日期时间
                    setDateTimeSelecting(false); // 选择后关闭模态框
                    handleSelect(selectedDate);
                  } else if (event.type === 'dismissed') { // 如果用户取消了选择
                    setDateTimeSelecting(false); // 关闭模态框
                  }
                }}
              />
              <Button title="cancel" onPress={() => setDateTimeSelecting(false)} />
            </View>
          </View>
        </Modal>
        <Button title='修改' onPress={() => setDateTimeSelecting(true)} />
      </View>
    );
  };

  const setLocationSelect = (index, input) => {

    return (
      <View style={styles.container}>
        {selectedLocation && (
          <Text>选定位置: {selectedLocation.latitude}, {selectedLocation.longitude}</Text>
        )}
        <Button title="选择位置" onPress={() => setLocationModalVisible(true)} />
        <LocationPickerModal
          isVisible={isLocationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onSelectLocation={handleSelectLocation}
        />
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
    }
    else if (item.title === 'date') {
      return dateSelect(index, item);
    }
    else if (item.title === 'location') {
      return setLocationSelect(index, item);
    }
    else {
      return (
        <TextInput
          style={styles.input}
          placeholder={`Enter value ${index + 1}`}
          value={item.value}
          onChangeText={(text) => handleInputChange(text, item.title, 'value')}
        />
      );
    }
  };







  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      {inputs.map((input, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text
            style={styles.title}>
            {input.title}
          </Text>
          <View>{handleItemSelect(index, input)}</View>
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
      <Button title='刷新' onPress={refreshPage} />

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
