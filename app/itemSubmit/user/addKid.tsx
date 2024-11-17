import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
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
      setNewKid(prev => ({
        ...prev,
        birthDate: selectedDate.toISOString().split('T')[0]
      }));
    }
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

  return (
    <ScrollView style={styles.container}>
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
        />
        
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.labelText}>出生日期</Text>
          <Text style={styles.dateText}>{newKid.birthDate}</Text>
        </TouchableOpacity>

        {(showDatePicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={new Date(newKid.birthDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
          />
        )}

        <View style={styles.genderContainer}>
          <TouchableOpacity 
            style={[
              styles.genderButton,
              newKid.gender === 'male' && styles.genderButtonSelected
            ]}
            onPress={() => setNewKid(prev => ({ ...prev, gender: 'male' }))}
          >
            <Text style={newKid.gender === 'male' ? styles.genderTextSelected : styles.genderText}>
              男孩
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.genderButton,
              newKid.gender === 'female' && styles.genderButtonSelected
            ]}
            onPress={() => setNewKid(prev => ({ ...prev, gender: 'female' }))}
          >
            <Text style={newKid.gender === 'female' ? styles.genderTextSelected : styles.genderText}>
              女孩
            </Text>
          </TouchableOpacity>
        </View>

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
          style={[styles.input, styles.descriptionInput]}
          placeholder="描述"
          value={newKid.description}
          onChangeText={(text) => setNewKid(prev => ({ ...prev, description: text }))}
          multiline
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
});

export default AddKidScreen; 