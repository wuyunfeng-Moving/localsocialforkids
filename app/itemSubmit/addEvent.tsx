import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, TextInput, Button, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import AddItemModal from './addnewItem/addNewItem';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import LocationPickerModal from './setLocation';
import { useCurrentLocation } from './LocationContext';
import { useWebSocket } from '../context/WebSocketProvider';
import LoginStatus from './user/loginStateDisplay';
import { useNavigation } from '@react-navigation/native';
import LoginScreen from './user/login';
import { FadeOutLeft } from 'react-native-reanimated';

const INITIAL_INPUTS = [
  { title: 'name', value: '小吴' },
  { title: 'age', value: '3' },
  { title: 'gender', value: '男' },
  { title: 'date', value: new Date().toISOString().split('T')[0] },
  { title: 'time', value: new Date().toTimeString().split(' ')[0].substring(0, 5) },
  { title: 'duration', value: '1' },
  { title: 'location', value: [] }
];

const MemoizedLoginStatus = React.memo(LoginStatus);

export default function TabOneScreen() {
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDateTimeSelecting, setDateTimeSelecting] = useState(false);
  const [isAgeSelecting, setAgeIsSelecting] = useState(false);
  const [isGenderSelecting, setGenderIsSelecting] = useState(false);
  const [isDurationSelecting, setDurationIsSelecting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { send, loginState,userInfo} = useWebSocket();
  const [isLoginning, setIsLoginning] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useCurrentLocation();

  const handleSelectLocation = useCallback((location) => {
    setSelectedLocation(location);
    const data = [location.longitude, location.latitude];
    handleInputChange(data, 'location', 'value');
    console.log('Selected Location:', location);
  }, []);

  const handleInputChange = useCallback((text, title, field) => {
    setInputs(prevInputs => prevInputs.map(input =>
      input.title === title ? { ...input, [field]: text } : input
    ));
  }, []);

  const handleDateTimeChange = useCallback((event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
      handleInputChange(selectedDate.toISOString().split('T')[0], 'date', 'value');
      handleInputChange(selectedDate.toTimeString().split(' ')[0].substring(0, 5), 'time', 'value');
    }
    setShowDatePicker(false);
  }, [handleInputChange]);

  const addInputField = useCallback((title_option) => {
    setInputs(prevInputs => [...prevInputs, { title: title_option, value: '' }]);
  }, []);

  const removeInputField = useCallback((title) => {
    setInputs(prevInputs => prevInputs.filter(input => input.title !== title));
  }, []);

  const addItem = useCallback(() => {
    const newItems = inputs.reduce((acc, item) => {
      if (item.title === 'location') {
        if (item.value.length === 0) return acc;
        acc[item.title] = item.value;
      } else if (item.title.trim() && item.value.trim()) {
        acc[item.title] = item.value;
      }
      return acc;
    }, {});

    if (Object.keys(newItems).length !== inputs.length) {
      alert("Please fill all the fields");
      return;
    }

    newItems.type = 'addNewEvent';
    console.log('sending data:', JSON.stringify(newItems));
    send(JSON.stringify(newItems));
  }, [inputs, send]);

  const renderSelector = useMemo(() => (title, value, options, isSelecting, setIsSelecting) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputText}>{value}</Text>
      <TouchableOpacity style={styles.editButton} onPress={() => setIsSelecting(true)}>
        <Text style={styles.editButtonText}>修改</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSelecting}
        onRequestClose={() => setIsSelecting(false)}
      >
        <View style={styles.modalView}>
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => {
              handleInputChange(itemValue, title, 'value');
              setIsSelecting(false);
            }}
            style={styles.picker}
          >
            {options.map((option, index) => (
              <Picker.Item label={option.toString()} value={option.toString()} key={index} />
            ))}
          </Picker>
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsSelecting(false)}>
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  ), [handleInputChange]);

  const renderInputField = useMemo(() => (input) => {
    switch (input.title) {
      case 'gender':
        return renderSelector('gender', input.value, ['男', '女'], isGenderSelecting, setGenderIsSelecting);
      case 'age':
        return renderSelector('age', input.value, Array.from({ length: 100 }, (_, i) => i + 1), isAgeSelecting, setAgeIsSelecting);
      case 'duration':
        return renderSelector('duration', input.value, Array.from({ length: 24 }, (_, i) => i + 1), isDurationSelecting, setDurationIsSelecting);
      case 'date':
      case 'time':
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>{input.value}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.editButtonText}>修改</Text>
            </TouchableOpacity>
          </View>
        );
      case 'location':
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>
              {selectedLocation
                ? `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                : '未选择'}
            </Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setLocationModalVisible(true)}>
              <Text style={styles.editButtonText}>选择位置</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <TextInput
            style={styles.input}
            placeholder={`Enter ${input.title}`}
            value={input.value}
            onChangeText={(text) => handleInputChange(text, input.title, 'value')}
          />
        );
    }
  }, [isGenderSelecting, isAgeSelecting, isDurationSelecting, selectedLocation, renderSelector, handleInputChange]);

  const renderedInputs = useMemo(() => inputs.map((input) => (
    <View key={input.title} style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{input.title}</Text>
      {renderInputField(input)}
      {!INITIAL_INPUTS.some(item => item.title === input.title) && (
        <TouchableOpacity style={styles.removeButton} onPress={() => removeInputField(input.title)}>
          <Text style={styles.removeButtonText}>删除</Text>
        </TouchableOpacity>
      )}
    </View>
  )), [inputs, renderInputField, removeInputField]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Modal visible={isLoginning}>
        <LoginScreen closeModal={() => {
          console.log("onclose modal is called!!");
          setIsLoginning(false)
        }
        } />
      </Modal>
      <LoginStatus isLoggedIn={loginState.logined} username={userInfo} onLoginButtonPress={() => setIsLoginning(true)} />
      {renderedInputs}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={addItem}>
          <Text style={styles.buttonText}>提交</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.buttonText}>添加更多</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <AddItemModal onItemSelect={addInputField} onClose={() => setIsModalVisible(false)} />
        </View>
      </Modal>
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateTimeChange}
          />
          <Button title="Close" onPress={() => setShowDatePicker(false)} />
        </View>
      </Modal>
      <LocationPickerModal
        isVisible={isLocationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleSelectLocation}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  datePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  removeButton: {
    marginTop: 5,
    padding: 8,
    backgroundColor: '#f44336',
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  refreshButton: {
    backgroundColor: '#9C27B0',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  picker: {
    width: 200,
    height: 200,
  },
  closeButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});