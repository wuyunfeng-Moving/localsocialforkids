const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 添加平台特定的模块解析
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 添加别名
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-maps': path.resolve(__dirname, './app/utils/platform-maps.js'),
};

module.exports = config; 