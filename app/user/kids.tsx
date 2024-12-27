import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Image} from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

interface Kid {
  id: number;
  name: string;
  age: number;
  birthDate: string; // 添加 birthDate 字段
  photoPath?: string;  // Add this line
}

interface KidsProps {
  kids: Kid[];
}

const colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA'];

const KidCard = ({ kid, index }: { kid: Kid; index: number }) => {
  const backgroundColor = colors[index % colors.length];

  return (
    <TouchableOpacity 
      style={[styles.kidCard, { backgroundColor }]} 
      onPress={() => router.push({
        pathname: './kidsDetail/[id]',
        params: { id: kid.id }
      })}
    >
      {kid.photoPath && (
        <Image 
          source={{ uri: kid.photoPath }} 
          style={styles.kidPhoto}
        />
      )}
      <View style={styles.kidInfo}>
        <Text style={styles.kidName}>{kid.name}</Text>
        <Text>年龄: {kid.age}   {kid.id}</Text>
        <Text>出生日期: {kid.birthDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

const KidsList: React.FC<KidsProps> = ({ kids }) => {
  return (
    <FlatList
      data={kids}
      renderItem={({ item, index }) => <KidCard kid={item} index={index} />}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.kidsList}
    />
  );
};

interface NewKidForm {
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  description: string;
  photoPath?: string;
  photoBase64?: string;
}

const KidsPage: React.FC = () => {
  const { userInfo, update } = useWebSocket();
  const [modalVisible, setModalVisible] = useState(false);
  const [newKid, setNewKid] = useState<NewKidForm>({
    name: '',  // Remove default values here
    birthDate: '',
    gender: 'male',
    description: '',
    photoPath: '',
    photoBase64: '',
  });

  // Add this function to handle modal opening
  const handleOpenModal = () => {
    setNewKid({
      name: '新的宝宝',
      birthDate: new Date().toISOString().split('T')[0],
      gender: 'male',
      description: '这是一个可爱的宝宝',
      photoPath: '',
      photoBase64: '',
    });
    setModalVisible(true);
  };

  useEffect(() => {
    console.log("userInfo",userInfo);
  }, [userInfo]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Compress and convert the image to base64
      const manipulatedImage = await ImageManipulator.manipulate(
        result.assets[0].uri,
        [{ resize: { width: 500 } }],
        { compress: 0.7, base64: true}
      );

      // Store both the local URI for preview and base64 for upload
      setNewKid(prev => ({ 
        ...prev, 
        photoPath: result.assets[0].uri,
        photoBase64: `data:image/jpeg;base64,${manipulatedImage.base64}`
      }));
    }
  };

  const handleAddKid = () => {
    // Include the base64 image data in the upload
    update.addkidinfo(
      {
        id: -1,
        name: newKid.name,
        birthDate: newKid.birthDate,
        gender: newKid.gender,
        description: newKid.description,
        photoPath: newKid.photoBase64 || '', // Send base64 image data
        personalSpaceUrl: '',
        guardians: []
      },
      (success, message) => {
        if (success) {
          setModalVisible(false);
          setNewKid({
            name: '',
            birthDate: '',
            gender: 'male',
            description: '',
            photoPath: '',
            photoBase64: '', // Reset base64 data too
          });
        } else {
          console.error(message);
        }
      }
    );
  };

  const dummyKids: Kid[] = userInfo.kidinfo.map((kid) => ({
    id: kid.id,
    name: kid.name,
    age: new Date().getFullYear() - new Date(kid.birthDate).getFullYear(),
    birthDate: kid.birthDate,
    photoPath: kid.photoPath,  // Add this line
  }));

  return (
    <View style={styles.kidsPage}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleOpenModal}  // Changed from setModalVisible(true)
      >
        <Text style={styles.addButtonText}>添加孩子</Text>
      </TouchableOpacity>

      <KidsList kids={dummyKids} />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加新的孩子</Text>
            
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
                <Text>男孩</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.genderButton,
                  newKid.gender === 'female' && styles.genderButtonSelected
                ]}
                onPress={() => setNewKid(prev => ({ ...prev, gender: 'female' }))}
              >
                <Text>女孩</Text>
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
                onPress={() => setModalVisible(false)}
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
        </View>
      </Modal>
    </View>
  );
};

// Add new styles
const styles = StyleSheet.create({
  kidsPage: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  kidsList: {
    flexGrow: 1,
  },
  kidCard: {
    flexDirection: 'row',  // Update this
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    alignItems: 'center',  // Add this
  },
  kidName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  kidPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  kidInfo: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
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
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoButtonText: {
    color: '#666',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  genderButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  genderButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  descriptionInput: {
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default KidsPage;
