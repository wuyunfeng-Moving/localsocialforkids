import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';


export const useCurrentLocation = () => {
  const [currentRegion, setCurrentRegion] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('useCurrentLocation');
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setCurrentRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.09,
          longitudeDelta: 0.04,
        });
      } catch (e) {
        setError('Error getting location');
      }
    })();
  }, []);

  return { currentRegion, error };
};