import React, { useEffect, useState } from 'react';
import { View, Button, Text, ScrollView } from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';
import { isEvent } from '../types/types';
import { useTestUser } from './user/testuser';

interface TestResult {
  testName: string;
  status: 'success' | 'failure' | 'pending';
  message?: string;
}

const TestPanel = () => {
  // 状态管理
  const [testResults, setTestResults] = useState<TestResult[]>([]); // 存储测试结果的数组
  const [isRunning, setIsRunning] = useState(false);               // 控制测试是否正在运行
  const { 
    registerMutation,
    login,
    loginState,
    searchEvents,
    update: { updateUserInfo }
  } = useWebSocket();  // 使用正确的context数据

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  useEffect(() => {
    delay(100).then(() => {
      console.log('Delayed 100ms');
    });
  }, []);

  // 添加新的测试结果到结果列表中
  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const testUser = useTestUser();  // 使用 hook 获取测试方法

  const runTests = async () => {
    console.log('Starting test sequence');
    setIsRunning(true);
    setTestResults([]);

    try {
      await testUser.testUser();      
      // console.log('Testing login for user 2...');
      // await testUser.testLogin(users[1].id);
      // console.log('User 2 login complete');

      // console.log('Testing logout for user 2...');
      // await testUser.testLogout(users[1].id);
      // console.log('User 2 logout complete');

      // console.log('Deleting user 1...');
      // await testUser.deleteUser(users[0].userId);

      // await testUser.deleteUser(users[1].id);
    } catch (error) {
      console.error('Test sequence failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // 测试登录功能
  const testLogin = async () => {
    addTestResult({
      testName: 'Login Test',
      status: 'pending'
    });

    try {
      // 使用正确的login方法
      login({
        email: testCredentials.email,
        password: testCredentials.password
      });

      // 检查登录状态
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = setInterval(() => {
          attempts++;
          if (loginState.logined) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (loginState.error) {
            clearInterval(checkInterval);
            reject(new Error(loginState.error));
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            reject(new Error('Login timeout'));
          }
        }, 1000);
      });

      addTestResult({
        testName: 'Login Test',
        status: 'success',
        message: 'Successfully logged in with new account'
      });
    } catch (error) {
      addTestResult({
        testName: 'Login Test',
        status: 'failure',
        message: error.message
      });
      throw error;
    }
  };

  // 测试搜索事件功能
  const testSearchEvents = async () => {
    // 添加待处理状态的测试结果
    addTestResult({
      testName: 'Search Events Test',
      status: 'pending'
    });

    try {
      // 使用正确的searchEvents方法
      await searchEvents.search({
        keyword: 'test',
        callback: (success, message, events) => {
          if (success && events.length > 0) {
            // 搜索成功且找到事件
            addTestResult({
              testName: 'Search Events Test',
              status: 'success',
              message: `Found ${events.length} events`
            });
          } else {
            throw new Error(message || 'Search failed');
          }
        }
      });
    } catch (error) {
      // 搜索失败，记录错误
      addTestResult({
        testName: 'Search Events Test',
        status: 'failure',
        message: error.message
      });
    }
  };

  // 测试创建事件功能
  const testCreateEvent = async () => {
    addTestResult({
      testName: 'Create Event Test',
      status: 'pending'
    });

    try {
      // Create test event data with all required fields according to Event type
      const newEvent = {
        // Required ID field (temporary ID for new event)
        id: 0,  // Add this field - server will replace with real ID
        
        // Required basic fields
        topic: 'Test Event',
        description: 'Test Description',
        dateTime: new Date().toISOString(),
        duration: 60,
        
        // Required place object with correct structure
        place: {
          location: [0, 0] as [number, number], // Explicitly type as tuple
          maxNumber: 10
        },
        
        // Required participant fields
        kidIds: [] as number[], // Explicitly type as number array
        userId: 0,             // Server will set this
        
        // Required status field
        status: 'preparing' as const, // Use const assertion for literal type
        
        // Optional fields (can be undefined)
        pendingSignUps: undefined,
        comments: undefined,
        chatIds: undefined,
        images: undefined,
      };

      // Log the event object for debugging
      console.log('Attempting to create event with data:', JSON.stringify(newEvent));
      
      // Verify event format before sending
      const isValidEvent = isEvent(newEvent);
      console.log('Event validation result:', isValidEvent);
      
      if (!isValidEvent) {
        throw new Error('Event validation failed before sending to server');
      }

      await updateUserInfo.mutateAsync({
        type: 'addNewEvent',
        newUserInfo: newEvent
      });

      addTestResult({
        testName: 'Create Event Test',
        status: 'success',
        message: 'Event created successfully'
      });
    } catch (error) {
      console.error('Create Event Test failed with error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      addTestResult({
        testName: 'Create Event Test',
        status: 'failure',
        message: `Error: ${error.message}\nDetails: ${JSON.stringify(error, null, 2)}`
      });
      throw error;
    }
  };

  // 渲染测试面板UI
  return (
    <View style={{ padding: 20 }}>
      {/* 测试执行按钮 */}
      <View >
        <Button 
          title={isRunning ? "Testing..." : "Run All Tests"} 
          onPress={runTests}
          disabled={isRunning}
        />
      </View>
      
      {/* 测试结果列表 */}
      <ScrollView style={{ marginTop: 20 }}>
        {testResults.map((result, index) => (
          <View 
            key={index} 
            style={{ 
              padding: 10, 
              marginBottom: 10,
              // 根据测试状态设置不同的背景颜色
              backgroundColor: 
                result.status === 'success' ? '#e6ffe6' :  // 成功为浅绿色
                result.status === 'failure' ? '#ffe6e6' :  // 失败为浅红色
                '#fff9e6'                                  // 进行中为浅黄色
            }}
          >
            <Text style={{ fontWeight: 'bold' }}>{result.testName}</Text>
            <Text>Status: {result.status}</Text>
            {result.message && <Text>Message: {result.message}</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default TestPanel;