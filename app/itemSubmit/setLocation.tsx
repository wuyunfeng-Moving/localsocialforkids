import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const LocationPickerModal = ({ isVisible, onClose, onSelectLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentRegion, setCurrentRegion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.09, // Approx. 10 km range for latitude
        longitudeDelta: 0.04, // Approx. 10 km range for longitude
      });
    })();
  }, []);

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
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