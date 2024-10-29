import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { KidInfo } from '@/app/types/types';
import { useWebSocket } from '@/app/context/WebSocketProvider';
import * as ImagePicker from 'expo-image-picker';

export default function KidPage() {
  const { id } = useLocalSearchParams();
  const { update, userInfo } = useWebSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [kid, setKid] = useState<KidInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (id && userInfo) {
      // Extract kid info from userInfo
      const kidInfo = userInfo.kidinfo?.find(k => k.id === parseInt(id));
      if (kidInfo) {
        setKid(kidInfo);
      }
    }
  }, [id, userInfo]);

  const handleSubmit = async () => {
    // 实现添加或更新孩子信息的逻辑
    // 如果是编辑模式,则更新现有数据
    // 如果是新增模式,则创建新数据
    // 示例: await fetch(`/api/kids/${id ? id : ''}`, {
    //   method: id ? 'PUT' : 'POST',
    //   body: JSON.stringify(kid),
    // });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (kid) {
      update.deletekidinfo(kid.id, (success, message) => {
        if (!success) {
          console.error(message);
        } else {
          // Navigate back after successful deletion
          router.back();
        }
      });
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setKid(prevKid => ({ ...prevKid, [name]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      handleInputChange('photoPath', result.assets[0].uri);
    }
  };

  if (!kid && !isEditing) return <View style={styles.loadingContainer}><Text>Loading...</Text></View>;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.form}>
            <View style={styles.photoContainer}>
              <TouchableOpacity onPress={pickImage}>
                <Image 
                  source={kid?.photoPath ? { uri: kid.photoPath } : require('@/assets/images/people.jpg')}
                  style={styles.photo}
                />
                <Text style={styles.photoText}>Tap to change photo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name:</Text>
              <TextInput
                style={styles.input}
                value={kid?.name || ''}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter kid's name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={kid?.description || ''}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                placeholder="Enter kid's description"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Birth Date:</Text>
              <TextInput
                style={styles.input}
                value={kid?.birthDate || ''}
                onChangeText={(value) => handleInputChange('birthDate', value)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Label:</Text>
              <TextInput
                style={styles.input}
                value={kid?.label || ''}
                onChangeText={(value) => handleInputChange('label', value)}
                placeholder="Enter kid's label"
              />
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title={id ? 'Update' : 'Add'}
              onPress={handleSubmit}
              color="#4CAF50"
            />
            <Button
              title="Delete"
              onPress={handleDelete}
              color="red"
            />
            {id && !isEditing && (
              <Button
                title="Edit"
                onPress={() => setIsEditing(true)}
                color="#2196F3"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  photoText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});
