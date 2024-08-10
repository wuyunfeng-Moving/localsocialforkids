import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useCurrentLocation } from '../context/LocationContext'; // 引入useLocation
import { LocationProvider } from '../context/LocationContext';

const LocationPickerModal = ({ isVisible, onClose, onSelectLocation }) => {
  const {currentRegion,err} = useCurrentLocation(); // 使用useLocation获取当前位置
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({longitude, latitude });
  };

  const handleConfirmLocation = () => {
    onSelectLocation(selectedLocation);
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalView}>
        <MapView
          style={styles.map}
          onPress={handleMapPress}
          initialRegion={currentRegion}
        >
          {selectedLocation && (
            <Marker title="Selected Location" coordinate={selectedLocation} />
          )}
        </MapView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleConfirmLocation}>
            <Text style={styles.buttonText}>Confirm Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  map: {
    width: '100%',
    height: '70%',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LocationPickerModal;
// Add your StyleSheet styles here