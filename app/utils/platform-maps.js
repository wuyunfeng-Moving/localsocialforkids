import { Platform } from 'react-native';

// 根据平台导出不同的地图实现
const Maps = Platform.select({
  web: require('./MapWrapper'),
  default: require('react-native-maps')
});

export default Maps; 