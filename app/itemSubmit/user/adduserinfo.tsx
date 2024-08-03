import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const UserForm = ({ onCloseModal }) => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [gender, setGender] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = () => {
    const userData = {
      name,
      birthdate: birthdate.toISOString().split('T')[0],
      gender,
    };
    console.log('用户信息:', userData);
    // 这里可以添加发送数据到服务器的代码
    alert('表单提交成功！');
    onCloseModal();
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthdate;
    setShowDatePicker(Platform.OS === 'ios');
    setBirthdate(currentDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>设置用户信息</Text>
      
      <Text style={styles.label}>姓名：</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="请输入姓名"
      />

      <Text style={styles.label}>出生日期：</Text>
      <Button onPress={() => setShowDatePicker(true)} title="选择日期" />
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={birthdate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      <Text>{birthdate.toISOString().split('T')[0]}</Text>

      <Text style={styles.label}>性别：</Text>
      <Picker
        selectedValue={gender}
        style={styles.picker}
        onValueChange={(itemValue) => setGender(itemValue)}
      >
        <Picker.Item label="请选择" value="" />
        <Picker.Item label="男" value="male" />
        <Picker.Item label="女" value="female" />
        <Picker.Item label="其他" value="other" />
      </Picker>

      <View style={styles.buttonContainer}>
        <Button title="提交" onPress={handleSubmit} />
        <Button title="取消" onPress={onCloseModal} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default UserForm;