import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, TextInput, Button, ScrollView, TouchableOpacity, Modal, Platform, KeyboardAvoidingView, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import AddItemModal from '../itemSubmit/addnewItem/addNewItem';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import LocationPickerModal from '../itemSubmit/setLocation';
import { useCurrentLocation } from '../context/LocationContext';
import { useWebSocket } from '../context/WebSocketProvider';
import LoginStatus from '../itemSubmit/user/loginStateDisplay';
import LoginScreen from '../itemSubmit/user/login';
import InputTopic from '../itemSubmit/addEvent/InputTopic';
import { router } from 'expo-router';

const INITIAL_INPUTS = [
  { title: 'childOrder', label: '孩子姓名', value: '' },
  { title: 'dateTime', label: '活动时间', value: new Date() },
  { title: 'duration', label: '活动长度（单位：小时）', value: 1 },
  { title: 'location', label: '地点', value: [] },
  { title: 'topic', label: '主题', value: '户外活动' },
  { title: 'description', label: '活动描述', value: '一起玩' },
  { title: 'maxNumber', label: '最大参与人数', value: 10 },
];

interface NewEventData {
  kidIds?: number[];
  place?: { location: number[]; maxNumber: number };
  dateTime?: string;
  duration?: number;
  topic?: string;
  description?: string;
  [key: string]: any;
}

export default function TabTwoScreen() {
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChildOrderSelecting, setChildOrderIsSelecting] = useState(false);
  const [isDurationSelecting, setDurationIsSelecting] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [dateTimeModalVisible, setDateTimeModalVisible] = useState(false);
  const { loginState, userInfo, update } = useWebSocket()??{};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentRegion } = useCurrentLocation();

  useEffect(() => {
    if (userInfo && userInfo.kidinfo && userInfo.kidinfo.length > 0) {
      const kidNames = userInfo.kidinfo.map(kid => kid.name);
      handleInputChange(kidNames[0], 'childOrder', 'value');
    }
  }, [userInfo]);

  useEffect(() => {
    console.log('currentLocation:', currentRegion);
    // Set default location when currentLocation is available
    if (currentRegion) {
      const defaultLocation = [currentRegion.longitude, currentRegion.latitude];
      handleInputChange(defaultLocation, 'location', 'value');
      setSelectedLocation({
        longitude: currentRegion.longitude,
        latitude: currentRegion.latitude,
      });
    }
  }, [currentRegion]);

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
      handleInputChange(selectedDate, 'dateTime', 'value');
    }
  }, [handleInputChange]);

  const addInputField = useCallback((title_option) => {
    setInputs(prevInputs => [...prevInputs, { title: title_option, value: '' }]);
  }, []);

  const removeInputField = useCallback((title) => {
    setInputs(prevInputs => prevInputs.filter(input => input.title !== title));
  }, []);

  const addItem = () => {
    const newItems: NewEventData = inputs.reduce((acc, item) => {
      switch (item.title) {
        case 'childOrder':
          const selectedKid = userInfo.kidinfo.find(kid => kid.name === item.value);
          if (selectedKid) {
            acc.kidIds = [selectedKid.id]; // Store as a number, not a string
          } else {
            console.error('Selected child not found in userInfo');
          }
          break;
        case 'dateTime':
          if (item.value instanceof Date) {
            acc.dateTime = item.value.toISOString();
          }
          break;
        case 'duration':
          acc.duration = parseInt(item.value, 10);
          break;
        case 'location':
          if (Array.isArray(item.value) && item.value.length === 2) {
            acc.place = {
              location: item.value,
              maxNumber: parseInt(inputs.find(input => input.title === 'maxNumber')?.value || '10', 10)
            };
          }
          break;
        case 'topic':
          acc.topic = item.value;
          break;
        case 'description':
          acc.description = item.value;
          break;
      }
      return acc;
    }, {} as NewEventData);

    // Check if all required fields are present
    const requiredFields = ['kidIds', 'place', 'dateTime', 'duration', 'topic', 'description'];
    const missingFields = requiredFields.filter(field => !newItems[field]);

    if (missingFields.length > 0) {
      alert(`请填写以下字段: ${missingFields.join(', ')}`);
      return;
    }

    console.log('sending data:', JSON.stringify(newItems));
    setIsSubmitting(true);
    update.updateUserInfo.mutate({type: 'addNewEvent', newUserInfo: newItems}, {
      onSuccess: () => {
        setIsSubmitting(false);
        Alert.alert(
          "提交成功",
          "事件已成功添加",
          [
            {
              text: "确认",
              onPress: () => router.push("/(tabs)/")
            }
          ]
        );
      },
      onError: (error) => {
        setIsSubmitting(false);
        alert('提交失败: ' + error.message);
      }
    });
  };

  const renderSelector = useMemo(() => (title, value, options, isSelecting, setIsSelecting) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputText}>{value.toString()}</Text>
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
            selectedValue={value.toString()}
            onValueChange={(itemValue) => {
              handleInputChange(title === 'duration' ? parseInt(itemValue, 10) : itemValue, title, 'value');
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
      case 'childOrder':
        return renderSelector(
          'childOrder',
          input.value,
          userInfo && userInfo.kidinfo ? userInfo.kidinfo.map(kid => kid.name) : [],
          isChildOrderSelecting,
          setChildOrderIsSelecting
        );
      case 'duration':
        return renderSelector('duration', input.value, Array.from({ length: 24 }, (_, i) => i + 1), isDurationSelecting, setDurationIsSelecting);
      case 'dateTime':
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>
              {input.value.toLocaleString()}
            </Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setDateTimeModalVisible(true)}>
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
                : '当前位置'}
            </Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setLocationModalVisible(true)}>
              <Text style={styles.editButtonText}>选择位置</Text>
            </TouchableOpacity>
          </View>
        );
      case 'topic':
        return (
          <InputTopic
            value={input.value}
            onChange={(value) => handleInputChange(value, 'topic', 'value')}
          />
        );
      case 'description':
        return (
          <TextInput
            style={styles.descriptionInput}
            placeholder="请输入活动描述"
            value={input.value}
            onChangeText={(text) => handleInputChange(text, 'description', 'value')}
            multiline
            numberOfLines={4}
          />
        );
      case 'maxNumber':
        return (
          <TextInput
            style={styles.input}
            placeholder="最大参与人数"
            value={input.value.toString()}
            onChangeText={(text) => {
              const number = parseInt(text, 10);
              if (!isNaN(number) && number > 0) {
                handleInputChange(number, 'maxNumber', 'value');
              } else if (text === '') {
                handleInputChange('', 'maxNumber', 'value');
              }
            }}
            keyboardType="numeric"
          />
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
  }, [isChildOrderSelecting, isDurationSelecting, selectedLocation, renderSelector, handleInputChange, userInfo]);

  const renderedInputs = useMemo(() => inputs.map((input) => (
    <View key={input.title} style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{input.label}</Text>
      {renderInputField(input)}
      {!INITIAL_INPUTS.some(item => item.title === input.title) && (
        <TouchableOpacity style={styles.removeButton} onPress={() => removeInputField(input.title)}>
          <Text style={styles.removeButtonText}>删除</Text>
        </TouchableOpacity>
      )}
    </View>
  )), [inputs, renderInputField, removeInputField]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <LoginStatus
          onLoginButtonPress={() => {
            router.push("../itemSubmit/user/login");
          }}
        />
        {renderedInputs}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={addItem}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>提交</Text>
            )}
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
        <Modal
          animationType="slide"
          transparent={true}
          visible={dateTimeModalVisible}
          onRequestClose={() => setDateTimeModalVisible(false)}
        >
          <View style={styles.modalView}>
            <DateTimePicker
              value={inputs.find((input) => input.title === 'dateTime').value}
              mode="datetime"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateTimeChange}
              style={styles.dateTimePicker}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setDateTimeModalVisible(false)}>
              <Text style={styles.closeButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <LocationPickerModal
          isVisible={isLocationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onSelectLocation={handleSelectLocation}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
    paddingBottom: 100, // Added extra bottom padding
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  removeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  picker: {
    width: 200,
    height: 200,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
  },
});
