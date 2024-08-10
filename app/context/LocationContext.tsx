import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationContextType {
  currentRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC = ({ children }) => {
  const [currentRegion, setCurrentRegion] = useState<LocationContextType['currentRegion']>(null);
  const [error, setError] = useState<string | null>(null);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access location was denied');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      console.log('地理位置:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      setCurrentRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.09,
        longitudeDelta: 0.04,
      });
    } catch (e) {
      setError('Error getting location');
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const refreshLocation = useCallback(async () => {
    await getLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ currentRegion, error, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useCurrentLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useCurrentLocation must be used within a LocationProvider');
  }
  return context;
};