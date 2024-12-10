import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import TestPanel from './test/TestPanel';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>测试面板</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      <TestPanel />

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  testContainer: {
    padding: 20,
    width: '90%',
  },
  testText: {
    fontSize: 16,
    marginVertical: 8,
  },
});
