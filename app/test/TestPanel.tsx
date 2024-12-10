import React, { useState } from 'react';
import { View, Button, Text, ScrollView } from 'react-native';
import { useWebSocket } from '../context/WebSocketProvider';

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
  
  // 测试账号凭证，使用时间戳确保邮箱唯一性
  const [testCredentials, setTestCredentials] = useState({
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    username: 'TestUser$' + Date.now()
  });

  // 添加新的测试结果到结果列表中
  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setIsRunning(true);    // 设置测试状态为运行中
    setTestResults([]);    // 清空之前的测试结果

    // 测试注册能
    const testRegister = async () => {
      // 添加待处理状态的测试结果
      addTestResult({
        testName: 'Register Test',
        status: 'pending'
      });

      try {
        // 使用正确的registerMutation
        await registerMutation.mutateAsync({
          email: testCredentials.email,
          password: testCredentials.password,
          username: testCredentials.username
        });

        // 注册成功，更新测试结果
        addTestResult({
          testName: 'Register Test',
          status: 'success',
          message: 'Successfully registered new user'
        });
      } catch (error) {
        // 注册失败，记录错误并中断后续测试
        addTestResult({
          testName: 'Register Test',
          status: 'failure',
          message: error.message
        });
        // If registration fails, throw error to stop subsequent tests
        throw error;
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
      // 添加待处理状态的测试结果
      addTestResult({
        testName: 'Create Event Test',
        status: 'pending'
      });

      try {
        // 创建测试事件数据
        const newEvent = {
          topic: 'Test Event',
          description: 'Test Description',
          dateTime: new Date().toISOString(),
          duration: 60,
          place: {
            location: [0, 0],
            maxNumber: 10
          }
        };

        // 使用正确的updateUserInfo方法
        await updateUserInfo.mutateAsync({
          type: 'addEvent',
          newUserInfo: newEvent
        });

        // 创建成功，更新测试结果
        addTestResult({
          testName: 'Create Event Test',
          status: 'success',
          message: 'Event created successfully'
        });
      } catch (error) {
        // 创建失败，记录错误
        addTestResult({
          testName: 'Create Event Test',
          status: 'failure',
          message: error.message
        });
      }
    };

    // Cleanup function to delete the created user
    const cleanup = async () => {
      try {
        // Assuming you have a deleteUser method in your WebSocket context
        await updateUserInfo.mutateAsync({
          type: 'deleteUser',
          email: testCredentials.email
        });
        console.log('User deleted successfully');
      } catch (error) {
        console.error('Failed to delete user:', error.message);
      }
    };

    // 按顺序执行所有测试用例
    try {
      await testRegister();      // 测试注册
      await testLogin();         // 测试登录
      await testCreateEvent();   // 测试创建事件
      await testSearchEvents();  // 测试搜索事件
    } finally {
      // await cleanup(); // Call cleanup to delete the user
      setIsRunning(false);      // 测试完成，重置运行状态
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