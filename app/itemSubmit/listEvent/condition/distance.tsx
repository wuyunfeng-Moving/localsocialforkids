import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const distanceOptions = [
  { label: '1公里', value: 1000 },
  { label: '3公里', value: 3000 },
  { label: '5公里', value: 5000 },
  { label: '10公里', value: 10000 },
  { label: '50公里', value: 50000 },
  { label: '不限', value: 100000000 },
];

const DistancePicker = ({ onDistanceChange, selectedDistance }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const defaultDistance = 3000; // 添加默认距离

  // 使用 useEffect 来设置初始值
  React.useEffect(() => {
    if (!selectedDistance) {
      onDistanceChange(defaultDistance);
    }
  }, []);

  const getLabel = (distance) => {
    const option = distanceOptions.find(opt => opt.value === Number(distance));
    return option ? option.label : "选择距离";
  };

  const handleDistanceChange = (itemValue) => {
    console.log("Distance selected:", itemValue);
    onDistanceChange(itemValue);
    setIsSelecting(false);
  };

  return (
    <View style={styles.pickerContainer}>
      <TouchableOpacity onPress={() => setIsSelecting(true)} style={styles.pickerButton}>
        <Text style={styles.pickerButtonText}>筛选范围: {getLabel(selectedDistance)}</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSelecting}
        onRequestClose={() => setIsSelecting(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {Platform.OS === 'ios' ? (
              <Picker
                selectedValue={selectedDistance}
                onValueChange={handleDistanceChange}
                style={styles.picker}
              >
                {distanceOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            ) : (
              <>
                <Picker
                  selectedValue={selectedDistance}
                  onValueChange={handleDistanceChange}
                  style={styles.picker}
                >
                  {distanceOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
                <TouchableOpacity onPress={() => setIsSelecting(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>关闭</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    marginVertical: 10,
  },
  pickerButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  picker: {
    width: '100%',
  },
  closeButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DistancePicker;