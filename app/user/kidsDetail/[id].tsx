import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { KidInfo } from '@/app/types/types';
import { useWebSocket } from '@/app/context/WebSocketProvider';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function KidPage() {
  const { id } = useLocalSearchParams();
  const { update, userInfo } = useWebSocket();
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
    if (kid && userInfo) {
      // Find the original kid info
      const originalKid = userInfo.kidinfo?.find(k => k.id === kid.id);
      
      // Check if there are any changes by comparing the objects
      const hasChanges = !originalKid || Object.keys(kid).some(key => 
        kid[key as keyof KidInfo] !== originalKid[key as keyof KidInfo]
      );

      if (hasChanges) {
        const newUserInfo = {
          ...userInfo,
          kidinfo: userInfo.kidinfo.map(k => 
            k.id === kid.id ? kid : k
          )
        }

        console.log('newUserInfo', newUserInfo);

        update.updateUserInfo.mutate({
          type: 'updateUserInfo',
          newUserInfo: newUserInfo
        }, {
          onSuccess: () => router.back(),
          onError: (error) => console.error(error)
        });
      } else {
        // No changes were made
        router.back();
      }
    }
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
    setKid(prevKid => prevKid ? { ...prevKid, [name]: value } : null);
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

      setKid(prevKid => prevKid ? {
        ...prevKid,
        photoPath: `data:image/jpeg;base64,${manipulatedImage.base64}`
      } : null);
    }
  };

  if (!kid) return <View style={styles.loadingContainer}><Text>加载中...</Text></View>;

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
                <Text style={styles.photoText}>点击更换照片</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>姓名:</Text>
              <TextInput
                style={styles.input}
                value={kid?.name || ''}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="请输入孩子的姓名"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>描述:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={kid?.description || ''}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                placeholder="请输入孩子的描述"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>出生日期:</Text>
              <TextInput
                style={styles.input}
                value={kid?.birthDate || ''}
                onChangeText={(value) => handleInputChange('birthDate', value)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>标签:</Text>
              <TextInput
                style={styles.input}
                value={kid?.label || ''}
                onChangeText={(value) => handleInputChange('label', value)}
                placeholder="请输入孩子的标签"
              />
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title={id ? '更新' : '添加'}
              onPress={handleSubmit}
              color="#4CAF50"
            />
            <Button
              title="删除"
              onPress={handleDelete}
              color="red"
            />
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
