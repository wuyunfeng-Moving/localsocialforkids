// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Add any other global mocks here 

require('jest-fetch-mock').enableMocks();
require('@testing-library/jest-dom');