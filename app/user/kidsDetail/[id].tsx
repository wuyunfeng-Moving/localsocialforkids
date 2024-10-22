import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { UserInfo } from '@/app/types/types';

interface Kid {
  id: string;
  name: string;
  age: number;
  image:string;//location
  description:string;
  label:string;
  // 添加其他需要的属性
}

export default function KidPage() {
  const { id } = useLocalSearchParams();
  const [kid, setKid] = useState<Kid | null>({
    id: '9999',
    name: 'testname',
    age: 5,
    image:'',
    description:'test description',
    label:'活泼好动',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // 从API获取孩子信息
    if (id) {
      fetchKidData(id as string);
    }
  }, [id]);

  const fetchKidData = async (kidId: string) => {
    // 实现从API获取孩子数据的逻辑
    // 示例: const response = await fetch(`/api/kids/${kidId}`);
    // const data = await response.json();
    // setKid(data);
  };

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

  const handleInputChange = (name: string, value: string) => {
    setKid(prevKid => ({ ...prevKid, [name]: value }));
  };

  if (!kid && !isEditing) return <View style={styles.loadingContainer}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id ? 'Edit Kid' : 'Add New Kid'}</Text>
      <View style={styles.form}>
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
          <Text style={styles.label}>Age:</Text>
          <TextInput
            style={styles.input}
            value={kid?.age?.toString() || ''}
            onChangeText={(value) => handleInputChange('age', value)}
            keyboardType="numeric"
            placeholder="Enter kid's age"
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
        {id && !isEditing && (
          <Button
            title="Edit"
            onPress={() => setIsEditing(true)}
            color="#2196F3"
          />
        )}
      </View>
    </View>
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
});
