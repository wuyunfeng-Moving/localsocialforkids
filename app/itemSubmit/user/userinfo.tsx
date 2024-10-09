import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';

const UserInfoScreen = () => {
  const { userInfo, loginState } = useWebSocket();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [kids, setKids] = useState([]);

  useEffect(() => {
    try {
      console.log("userinfo.tsx:", userInfo,loginState);
      if (loginState.logined && userInfo) {
        setName(userInfo?.username || '');
        setEmail(userInfo?.email || '');
        setKids(userInfo.kidinfo || []);
      }
    } catch (error) {
      console.log('error:', error);
    }
  }, [userInfo, loginState.logined]);

  return (
    <ScrollView style={styles.container}>
      {loginState.logined ? (
        <>
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfoItem}>
              <Text style={styles.label}>姓名：</Text>
              <Text style={styles.value}>{name}</Text>
            </View>
            <View style={styles.userInfoItem}>
              <Text style={styles.label}>邮箱：</Text>
              <Text style={styles.value}>{email}</Text>
            </View>
          </View>
          <Text style={styles.kidsTitle}>孩子信息</Text>
          {kids.length > 0 ? (
            kids.map((kid, index) => (
              <View key={index} style={styles.kidInfoContainer}>
                <Text style={styles.kidTitle}>孩子 {index + 1}</Text>
                {Object.entries(kid).map(([key, value]) => {
                  if (key === 'guardians') {
                    return (
                      <View key={key} style={styles.guardiansContainer}>
                        <Text style={styles.label}>监护人：</Text>
                        {value.map((guardian, gIndex) => (
                          <View key={gIndex} style={styles.guardianItem}>
                            <Text style={styles.guardianLabel}>{guardian.relationship}：</Text>
                            <Text style={styles.guardianValue}>{guardian.userId}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  }
                  return (
                    <View key={key} style={styles.kidInfoItem}>
                      <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}：</Text>
                      <Text style={styles.kidValue}>
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={styles.noKidsText}>暂无孩子信息</Text>
          )}
        </>
      ) : (
        <Text style={styles.notLoggedInText}>未登录</Text>
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  userInfoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  userInfoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  kidsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  kidInfoContainer: {
    backgroundColor: '#e6f3ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  kidTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  kidValue: {
    fontSize: 16,
    color: '#007AFF',
  },
  noKidsText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  guardiansContainer: {
    marginBottom: 12,
  },
  guardianItem: {
    flexDirection: 'row',
    marginLeft: 16,
    marginBottom: 4,
  },
  guardianLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
    color: '#666',
  },
  guardianValue: {
    fontSize: 14,
    color: '#333',
  },
  kidInfoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  notLoggedInText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
  },
});

export default UserInfoScreen;