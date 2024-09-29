import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BackButtonProps {
  style?: object;
  onPress: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ style = {}, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      <Text style={styles.text}>← 返回</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});

export default BackButton;
