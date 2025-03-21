import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web 平台的地图替代组件
const MapView = ({ children, style, ...props }) => (
  <View style={[styles.mapContainer, style]}>
    <Text>地图功能在 Web 平台上不可用</Text>
    {children}
  </View>
);

// 添加所有需要的子组件
MapView.Marker = () => null;
MapView.Polygon = () => null;
MapView.Polyline = () => null;
MapView.Circle = () => null;
MapView.Callout = () => null;
MapView.Overlay = () => null;

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapView;
export { MapView }; 