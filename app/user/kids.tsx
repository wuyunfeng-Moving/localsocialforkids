import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';
import { router } from 'expo-router';

interface Kid {
  id: number;
  name: string;
  age: number;
  birthDate: string; // 添加 birthDate 字段
}

interface KidsProps {
  kids: Kid[];
}

const colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA'];

const KidCard: React.FC<{ kid: Kid; index: number }> = ({ kid, index }) => {
  const backgroundColor = colors[index % colors.length];
  return (
    <TouchableOpacity 
      style={[styles.kidCard, { backgroundColor }]} 
      onPress={() => router.push({
        pathname: './kidsDetail/[id]',
        params: { id: kid.id }
      })}
    >
      <Text style={styles.kidName}>{kid.name}</Text>
      <Text>年龄: {kid.age}   {kid.id}</Text>
      <Text>出生日期: {kid.birthDate}</Text>
    </TouchableOpacity>
  );
};

const KidsList: React.FC<KidsProps> = ({ kids }) => {
  return (
    <FlatList
      data={kids}
      renderItem={({ item, index }) => <KidCard kid={item} index={index} />}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.kidsList}
    />
  );
};

const KidsPage: React.FC = () => {
  const { userInfo } = useWebSocket();

  const dummyKids: Kid[] = userInfo.kidinfo.map((kid) => ({
    id: kid.id,
    name: kid.name,
    age: new Date().getFullYear() - new Date(kid.birthDate).getFullYear(),
    birthDate: kid.birthDate,
  }));

  return (
    <View style={styles.kidsPage}>
      <KidsList kids={dummyKids} />
    </View>
  );
};

const styles = StyleSheet.create({
  kidsPage: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  kidsList: {
    flexGrow: 1,
  },
  kidCard: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  kidName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default KidsPage;
