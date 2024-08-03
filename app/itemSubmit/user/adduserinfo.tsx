import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useWebSocket } from '../../context/WebSocketProvider';

const UserForm = ({ onCloseModal }) => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [tempBirthdate, setTempBirthdate] = useState(new Date());
  const [gender, setGender] = useState('');
  const [relation, setRelation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showRelationPicker, setShowRelationPicker] = useState(false);

  const { send } = useWebSocket();

  const handleSubmit = () => {
    const userData = {
      name,
      birthdate: birthdate.toISOString().split('T')[0],
      gender,
      relation,
    };
    userData.type = 'addkidinfo';
    send(userData);
    alert('表单提交成功！');
    onCloseModal();
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempBirthdate;
    setTempBirthdate(currentDate);
  };

  const confirmDate = () => {
    setBirthdate(tempBirthdate);
    setShowDatePicker(false);
  };

  const cancelDate = () => {
    setTempBirthdate(birthdate);
    setShowDatePicker(false);
  };

  const toggleGenderPicker = () => {
    setShowGenderPicker(!showGenderPicker);
  };

  const toggleRelationPicker = () => {
    setShowRelationPicker(!showRelationPicker);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>设置用户信息</Text>
      
      <View style={styles.inputContainer}>
        <MaterialIcons name="person" size={24} color="#4A90E2" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="请输入姓名"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="cake" size={24} color="#4A90E2" style={styles.icon} />
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
          <Text style={styles.dateButtonText}>
            {birthdate.toISOString().split('T')[0]}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <DateTimePicker
              testID="dateTimePicker"
              value={tempBirthdate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
            />
            <View style={styles.dateButtonContainer}>
              <TouchableOpacity style={[styles.dateActionButton, styles.confirmButton]} onPress={confirmDate}>
                <Text style={styles.dateActionButtonText}>确认</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateActionButton, styles.cancelButton]} onPress={cancelDate}>
                <Text style={styles.dateActionButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.inputContainer}>
        <MaterialIcons name="wc" size={24} color="#4A90E2" style={styles.icon} />
        <TouchableOpacity onPress={toggleGenderPicker} style={styles.pickerButton}>
          <Text style={styles.pickerButtonText}>
            {gender ? (gender === 'male' ? '男' : gender === 'female' ? '女' : '其他') : '请选择性别'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="people" size={24} color="#4A90E2" style={styles.icon} />
        <TouchableOpacity onPress={toggleRelationPicker} style={styles.pickerButton}>
          <Text style={styles.pickerButtonText}>
            {relation || '请选择关系'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={gender}
              style={styles.picker}
              onValueChange={(itemValue) => {
                setGender(itemValue);
                setShowGenderPicker(false);
              }}
            >
              <Picker.Item label="请选择性别" value="" />
              <Picker.Item label="男" value="male" />
              <Picker.Item label="女" value="female" />
              <Picker.Item label="其他" value="other" />
            </Picker>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowGenderPicker(false)}>
              <Text style={styles.closeButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRelationPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={relation}
              style={styles.picker}
              onValueChange={(itemValue) => {
                setRelation(itemValue);
                setShowRelationPicker(false);
              }}
            >
              <Picker.Item label="请选择关系" value="" />
              <Picker.Item label="爸爸" value="爸爸" />
              <Picker.Item label="妈妈" value="妈妈" />
              <Picker.Item label="爷爷" value="爷爷" />
              <Picker.Item label="奶奶" value="奶奶" />
              <Picker.Item label="外公" value="外公" />
              <Picker.Item label="外婆" value="外婆" />
              <Picker.Item label="叔叔" value="叔叔" />
              <Picker.Item label="阿姨" value="阿姨" />
              <Picker.Item label="哥哥" value="哥哥" />
              <Picker.Item label="姐姐" value="姐姐" />
            </Picker>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowRelationPicker(false)}>
              <Text style={styles.closeButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
          <Text style={styles.buttonText}>提交</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCloseModal}>
          <Text style={styles.buttonText}>取消</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  dateButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    padding: 20,
  },
  picker: {
    height: 200,
  },
  closeButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  dateActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  dateActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserForm;