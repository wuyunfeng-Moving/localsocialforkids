import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface NewKidForm {
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  description: string;
  photoPath?: string;
  photoBase64?: string;
}

const AddKidScreen = () => {
  const { update } = useWebSocket();
  const [newKid, setNewKid] = useState<NewKidForm>({
    name: '新的宝宝',
    birthDate: new Date().toISOString().split('T')[0],
    gender: 'male',
    description: '这是一个可爱的宝宝',
    photoPath: '',
    photoBase64: '',
  });

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
        guardians: []
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
        
        <TextInput
          style={styles.input}
          placeholder="出生日期 (YYYY-MM-DD)"
          value={newKid.birthDate}
          onChangeText={(text) => setNewKid(prev => ({ ...prev, birthDate: text }))}
        />

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
});

export default AddKidScreen; 