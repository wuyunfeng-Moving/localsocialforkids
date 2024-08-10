import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const PRESET_TOPICS = ['运动', '学习', '音乐', '艺术', '科技', '户外活动', '社交', '阅读'];

interface InputTopicProps {
  value: string;
  onChange: (value: string) => void;
}

const InputTopic: React.FC<InputTopicProps> = ({ value, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="输入主题"
        />
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text>{isExpanded ? '收起' : '展开'}</Text>
        </TouchableOpacity>
      </View>
      {isExpanded && (
        <View style={styles.topicButtonsContainer}>
          {PRESET_TOPICS.map((topic, index) => (
            <TouchableOpacity
              key={index}
              style={styles.topicButton}
              onPress={() => onChange(topic)}
            >
              <Text>{topic}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  expandButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  topicButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  topicButton: {
    padding: 10,
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
});

export default InputTopic;