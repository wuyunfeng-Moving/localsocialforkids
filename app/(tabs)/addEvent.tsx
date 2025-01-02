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
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const INITIAL_INPUTS = [
  { title: 'childOrder', label: '孩子姓名', value: '' },
  { title: 'dateTime', label: '活动时间', value: new Date() },
  { title: 'duration', label: '活动长度（单位：小时）', value: 1 },
  { title: 'location', label: '地点', value: [] },
  { title: 'topic', label: '主题', value: '户外活动' },
  { title: 'description', label: '活动描述', value: '一起玩' },
  { title: 'maxNumber', label: '最大参与人数', value: 10 },
  { title: 'images', label: '活动图片（最多3张）', value: [] },
];

interface NewEventData {
  kidIds?: number[];
  place?: { location: number[]; maxNumber: number };
  dateTime?: string;
  duration?: number;
  topic?: string;
  description?: string;
  images?: string[];
  [key: string]: any;
}

const compressAndConvertImage = async (uri: string): Promise<string> => {
    try {
        // 使用 image-manipulator 压缩和转换图片
        const manipulatedImage = await manipulateAsync(
            uri,
            [{ resize: { width: 500 } }],
            { compress: 0.7, format: SaveFormat.JPEG, base64: true }
        );
        
        return `data:image/jpeg;base64,${manipulatedImage.base64}`;
    } catch (error) {
        console.error('Error compressing image:', error);
        throw error;
    }
};

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

  const handleSelectLocation = useCallback((location:any) => {
    setSelectedLocation(location);
    const data = [location.longitude, location.latitude];
    handleInputChange(data, 'location', 'value');
    console.log('Selected Location:', location);
  }, []);

  const handleInputChange = useCallback((text:any, title:any, field:any) => {
    setInputs(prevInputs => prevInputs.map((input:any) =>
      input.title === title ? { ...input, [field]: text } : input
    ));
  }, []);

  const handleDateTimeChange = useCallback((event:any, selectedDate:any) => {
    if (selectedDate) {
      handleInputChange(selectedDate, 'dateTime', 'value');
    }
  }, [handleInputChange]);

  const addInputField = useCallback((title_option:any) => {
    setInputs(prevInputs => [...prevInputs, { title: title_option, value: '' }]);
  }, []);

  const removeInputField = useCallback((title:any) => {
    setInputs(prevInputs => prevInputs.filter(input => input.title !== title));
  }, []);

  const addItem = async () => {
    try {
        // 处理图片
        const imagesInput = inputs.find(input => input.title === 'images')?.value || [];
        const processedImages = await Promise.all(
            imagesInput.map(async (uri: string, index: number) => ({
                id: index,
                imageData: await compressAndConvertImage(uri)
            }))
        );

        // 构建事件数据
        const eventData: Event = {
            id: -1,
            place: {
                location: inputs.find(input => input.title === 'location')?.value || [0, 0],
                maxNumber: parseInt(inputs.find(input => input.title === 'maxNumber')?.value || '10', 10)
            },
            dateTime: inputs.find(input => input.title === 'dateTime')?.value.toISOString() || new Date().toISOString(),
            duration: parseInt(inputs.find(input => input.title === 'duration')?.value || '1', 10),
            topic: inputs.find(input => input.title === 'topic')?.value || '',
            description: inputs.find(input => input.title === 'description')?.value || '',
            kidIds: [],
            userId: userInfo?.id,
            status: 'preparing',
            images: processedImages
        };

        // 添加kidIds
        const selectedKid = userInfo?.kidinfo.find(kid => 
            kid.name === inputs.find(input => input.title === 'childOrder')?.value
        );
        if (selectedKid) {
            eventData.kidIds = [selectedKid.id];
        }

        // 检查必填字段
        if (!eventData.kidIds.length || 
            !eventData.place.location.length || 
            !eventData.topic || 
            !eventData.description) {
            Alert.alert('提示', '请填写所有必填字段');
            return;
        }

        setIsSubmitting(true);
        update.updateUserInfo.mutate(
            { 
                type: 'addNewEvent', 
                newUserInfo: eventData 
            },
            {
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
                    Alert.alert('错误', '提交失败: ' + error.message);
                }
            }
        );
    } catch (error) {
        setIsSubmitting(false);
        Alert.alert('错误', '提交失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
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
        <View style={styles.bottomModalContainer}>
          <View style={styles.bottomModalContent}>
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
      case 'images':
        return (
          <View style={styles.imageContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {input.value.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: image }} 
                    style={styles.imagePreview} 
                  />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => {
                      const newImages = [...input.value];
                      newImages.splice(index, 1);
                      handleInputChange(newImages, 'images', 'value');
                    }}
                  >
                    <Text style={styles.removeImageButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {input.value.length < 3 && (
                <TouchableOpacity 
                  style={styles.addImageButton}
                  onPress={async () => {
                    try {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 1, // 设置为1，因为我们会使用 manipulator 来压缩
                      });
                      
                      if (!result.canceled && result.assets && result.assets.length > 0) {
                        const newImages = [...input.value, result.assets[0].uri];
                        handleInputChange(newImages, 'images', 'value');
                      }
                    } catch (error) {
                      console.error('Error picking image:', error);
                      Alert.alert('错误', '选择图片时出现错误');
                    }
                  }}
                >
                  <Text style={styles.addImageButtonText}>+</Text>
                  <Text style={styles.addImageHintText}>
                    {input.value.length === 0 ? '添加图片' : `还可添加${3 - input.value.length}张`}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
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
  bottomModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  imageContainer: {
    marginVertical: 10,
  },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButtonText: {
    fontSize: 32,
    color: '#ccc',
  },
  addImageHintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
