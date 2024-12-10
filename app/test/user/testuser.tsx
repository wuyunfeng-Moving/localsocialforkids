import { UserInfo } from "../../types/types";
import { useWebSocket } from "../../context/WebSocketProvider";
import { useState, useCallback } from "react";

interface TestResult {
  testName: string;
  status: 'success' | 'failure' | 'pending';
  message?: string;
}

interface TestUserInstance {
  userId: number;
  credentials: {
    email: string;
    password: string;
    username: string;
  };
}

interface TestUserMethods {
  createUser: (num: number) => Promise<{ success: boolean, usersIds: number[] }>;
  testLogin: (userId: number) => Promise<{ success: boolean, message: string }>;
  testLogout: (userId: number) => Promise<{ success: boolean, message: string }>;
  deleteUser: (userId: number) => Promise<{ success: boolean, message: string }>;
  getTestUsers: () => TestUserInstance[];
  getTestUser: (userId: number) => TestUserInstance | undefined;
}

export const TestUser = (): TestUserMethods => {
  const {
    registerMutation,
    login,
    loginState,
    logout,
    update: { updateUserInfo }
  } = useWebSocket();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testUsers, setTestUsers] = useState<TestUserInstance[]>([]);

  const addTestResult = useCallback((result: TestResult) => {
    setTestResults(prev => [...prev, result]);
    console.log(`Test Result: ${result.testName} - ${result.status} - ${result.message || ''}`);
  }, []);

  const generateTestCredentials = useCallback((index: number) => ({
    email: `test${Date.now()}_${index}@example.com`,
    password: 'password123',
    username: `TestUser${Date.now()}_${index}`
  }), []);

  const createUser = useCallback(async (num: number) => {
    const createdUsersIds: number[] = [];
    for (let i = 0; i < num; i++) {
      const credentials = generateTestCredentials(i);
      
      addTestResult({
        testName: `Register Test User ${i + 1}`,
        status: 'pending'
      });

      try {
        const result = await registerMutation.mutateAsync({
          email: credentials.email,
          password: credentials.password,
          username: credentials.username
        });

        if (result.success) {
          const newTestUser: TestUserInstance = {
            credentials,
            userId: result.userInfo.id
          };
          
          setTestUsers(prev => [...prev, newTestUser]);
          createdUsersIds.push(result.userInfo.id);
          addTestResult({
            testName: `Register Test User ${i + 1}`,
            status: 'success',
            message: `Successfully registered user ${credentials.email}`
          });
        }
      } catch (error) {
        addTestResult({
          testName: `Register Test User ${i + 1}`,
          status: 'failure',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        return { success: false, usersIds: createdUsersIds };
      }
    }

    return { success: true, usersIds: createdUsersIds };
  }, [generateTestCredentials, addTestResult, registerMutation]);

  const testLogin = useCallback(async (userId: number) => {
    const targetUser = userId 
      ? testUsers.find(u => u.userId === userId)
      : testUsers[0];

    if (!targetUser) {
      return { success: false, message: 'No test user available' };
    }

    addTestResult({
      testName: `Login Test for ${targetUser.credentials.email}`,
      status: 'pending'
    });

    try {
      await login({
        email: targetUser.credentials.email,
        password: targetUser.credentials.password
      });

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
        testName: `Login Test for ${targetUser.credentials.email}`,
        status: 'success',
        message: 'Successfully logged in'
      });
      return { success: true, message: 'Login successful' };
    } catch (error) {
      addTestResult({
        testName: `Login Test for ${targetUser.credentials.email}`,
        status: 'failure',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, message: error instanceof Error ? error.message : 'Login failed' };
    }
  }, [testUsers, login, loginState, addTestResult]);

  const testLogout = useCallback(async (userId: number) => {
    const targetUser = userId 
      ? testUsers.find(u => u.userId === userId)
      : testUsers[0];

    if (!targetUser) {
      return { success: false, message: 'No test user available' };
    }

    addTestResult({
      testName: `Logout Test for ${targetUser.credentials.email}`,
      status: 'pending'
    });

    try {
      await logout();
      
      if (!loginState.logined) {
        addTestResult({
          testName: `Logout Test for ${targetUser.credentials.email}`,
          status: 'success',
          message: 'Successfully logged out'
        });
        return { success: true, message: 'Logout successful' };
      } else {
        throw new Error('Logout failed - user still logged in');
      }
    } catch (error) {
      addTestResult({
        testName: `Logout Test for ${targetUser.credentials.email}`,
        status: 'failure',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, message: error instanceof Error ? error.message : 'Logout failed' };
    }
  }, [testUsers, logout, loginState, addTestResult]);

  const deleteUser = useCallback(async (userId: number) => {
    const usersToDelete = userId 
      ? testUsers.filter(u => u.userId === userId)
      : testUsers;

    if (usersToDelete.length === 0) {
      return { success: false, message: 'No test users to delete' };
    }

    addTestResult({
      testName: 'Delete Test Users',
      status: 'pending'
    });

    try {
      for (const user of usersToDelete) {
        await updateUserInfo.mutateAsync({
          type: 'deleteUser',
          newUserInfo: { email: user.credentials.email }
        });
      }

      setTestUsers(prev => prev.filter(u => !usersToDelete.includes(u)));
      addTestResult({
        testName: 'Delete Test Users',
        status: 'success',
        message: `Successfully deleted ${usersToDelete.length} test users`
      });
      return { success: true, message: 'Users deleted successfully' };
    } catch (error) {
      addTestResult({
        testName: 'Delete Test Users',
        status: 'failure',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, message: 'Failed to delete test users' };
    }
  }, [testUsers, updateUserInfo, addTestResult]);

  const getTestUsers = useCallback(() => {
    return testUsers;
  }, [testUsers]);

  const getTestUser = useCallback((userId: number) => {
    return testUsers.find(u => u.userId === userId);
  }, [testUsers]);

  return {
    createUser,
    testLogin,
    testLogout,
    deleteUser,
    getTestUsers,
    getTestUser
  };
};

export const useTestUser = () => {
  return TestUser();
};




