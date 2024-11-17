import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';

interface NewKidForm {
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  description: string;
  photoPath?: string;
  photoBase64?: string;
  relationship: string;
}

const AddKidScreen = () => {
  const { update, userInfo } = useWebSocket();
  const [newKid, setNewKid] = useState<NewKidForm>({
    name: '新的宝宝',
    birthDate: new Date().toISOString().split('T')[0],
    gender: 'male',
    description: '这是一个可爱的宝宝',
    photoPath: '',
    photoBase64: '',
    relationship: 'father',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [showGenderModal, setShowGenderModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputRef = useRef<View>(null);

  const relationships = [
    { label: '爸爸', value: 'father' },
    { label: '妈妈', value: 'mother' },
    { label: '爷爷', value: 'grandfather' },
    { label: '奶奶', value: 'grandmother' },
    { label: '外公', value: 'maternal_grandfather' },
    { label: '外婆', value: 'maternal_grandmother' },
  ];

  const getRelationshipLabel = (value: string) => {
    return relationships.find(r => r.value === value)?.label || '';
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const manipulatedImage = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 500 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      setNewKid(prev => ({ 
        ...prev, 
        photoPath: result.assets[0].uri,
        photoBase64: `data:image/jpeg;base64,${manipulatedImage.base64}`
      }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleDateConfirm = () => {
    setNewKid(prev => ({
      ...prev,
      birthDate: tempDate.toISOString().split('T')[0]
    }));
    setShowDatePicker(false);
  };

  const handleAddKid = () => {
    update.addkidinfo(
      {
        id: -1,
        name: newKid.name,
        birthDate: newKid.birthDate,
        gender: newKid.gender,
        description: newKid.description,
        photoPath: newKid.photoBase64 || '',
        personalSpaceUrl: '',
        guardians: [
          {
            userId: userInfo?.id || 0,
            relationship: newKid.relationship
          }
        ]
      },
      (success, message) => {
        if (success) {
          router.back();
        } else {
          console.error(message);
        }
      }
    );
  };

  const handleInputFocus = (y: number, inputRef?: React.RefObject<View>) => {
    if (inputRef?.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current?.scrollTo({
          y: pageY,
          animated: true
        });
      });
    } else {
      scrollViewRef.current?.scrollTo({
        y: y,
        animated: true
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
      >
        <View style={styles.content}>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            {newKid.photoPath ? (
              <Image source={{ uri: newKid.photoPath }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoButtonText}>选择照片</Text>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="孩子姓名"
            value={newKid.name}
            onChangeText={(text) => setNewKid(prev => ({ ...prev, name: text }))}
            onFocus={() => handleInputFocus(0)}
          />
          
          <TouchableOpacity 
            style={styles.input} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.labelText}>出生日期</Text>
            <Text style={styles.dateText}>{newKid.birthDate}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.dateButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.dateButton, styles.cancelButton]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.buttonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.dateButton, styles.confirmButton]}
                    onPress={handleDateConfirm}
                  >
                    <Text style={styles.buttonText}>确认</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowGenderModal(true)}
          >
            <Text style={styles.labelText}>性别</Text>
            <Text style={styles.valueText}>
              {newKid.gender === 'male' ? '男孩' : '女孩'}
            </Text>
          </TouchableOpacity>

          {showGenderModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.relationshipModal}>
                <TouchableOpacity
                  style={[
                    styles.relationshipItem,
                    newKid.gender === 'male' && styles.relationshipItemSelected
                  ]}
                  onPress={() => {
                    setNewKid(prev => ({ ...prev, gender: 'male' }));
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[
                    styles.relationshipText,
                    newKid.gender === 'male' && styles.relationshipTextSelected
                  ]}>
                    男孩
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.relationshipItem,
                    newKid.gender === 'female' && styles.relationshipItemSelected
                  ]}
                  onPress={() => {
                    setNewKid(prev => ({ ...prev, gender: 'female' }));
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[
                    styles.relationshipText,
                    newKid.gender === 'female' && styles.relationshipTextSelected
                  ]}>
                    女孩
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowGenderModal(false)}
                >
                  <Text style={styles.closeButtonText}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowRelationshipModal(true)}
          >
            <Text style={styles.labelText}>与孩子的关系</Text>
            <Text style={styles.valueText}>{getRelationshipLabel(newKid.relationship)}</Text>
          </TouchableOpacity>

          {showRelationshipModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.relationshipModal}>
                {relationships.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.relationshipItem,
                      newKid.relationship === item.value && styles.relationshipItemSelected
                    ]}
                    onPress={() => {
                      setNewKid(prev => ({ ...prev, relationship: item.value }));
                      setShowRelationshipModal(false);
                    }}
                  >
                    <Text style={[
                      styles.relationshipText,
                      newKid.relationship === item.value && styles.relationshipTextSelected
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowRelationshipModal(false)}
                >
                  <Text style={styles.closeButtonText}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TextInput
            ref={descriptionInputRef}
            style={[styles.input, styles.descriptionInput]}
            placeholder="描述"
            value={newKid.description}
            onChangeText={(text) => setNewKid(prev => ({ ...prev, description: text }))}
            multiline
            onFocus={() => handleInputFocus(0, descriptionInputRef)}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>取消</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]}
              onPress={handleAddKid}
            >
              <Text style={styles.buttonText}>确认</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    padding: 20,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoButtonText: {
    color: '#666',
    fontSize: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#007AFF',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  genderTextSelected: {
    fontSize: 16,
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  labelText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  relationshipModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  relationshipItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  relationshipItemSelected: {
    backgroundColor: '#007AFF',
  },
  relationshipText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  relationshipTextSelected: {
    color: 'white',
  },
  closeButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iosDatePicker: {
    backgroundColor: 'white',
    height: 200,
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  dateButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 8,
  },
});

export default AddKidScreen; 