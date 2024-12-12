import { UserInfo } from "../../types/types";
import { useWebSocket } from "../../context/WebSocketProvider";
import { useState, useCallback, useEffect } from "react";

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
  testUser: () => Promise<void>;
  createUser: (num: number) => Promise<{ success: boolean, usersIds: number[], users: TestUserInstance[] }>;
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
  const [isTestLogin, setIsTestLogin] = useState(false);
  const [isTestLogout, setIsTestLogout] = useState(false);
  const [isTestDelete, setIsTestDelete] = useState(false);
  const [isFinish, setIsFinish] = useState(false);

  const addTestResult = useCallback((result: TestResult) => {
    setTestResults(prev => [...prev, result]);
    console.log(`Test Result: ${result.testName} - ${result.status} - ${result.message || ''}`);
  }, []);

  const generateTestCredentials = useCallback((index: number) => ({
    email: `test${Date.now()}_${index}@example.com`,
    password: 'password123',
    username: `TestUser${Date.now()}_${index}`
  }), []);

  // useEffect(() => { 
  //   const testLoginResult =async () => {
  //     console.log("start to test login");
  //     const testLoginResult =await testLogin(testUsers[0].userId);

  //     console.log("testLoginResult",testLoginResult);
  //     if(testLoginResult.success){
  //       console.log("testLoginResult success");
  //       setIsTestLogin(false);
  //       setIsTestLogout(true);
  //     }
  //   }


  //   const testLogoutResult =async () => {
  //     console.log("start to test logout");
  //     const testLogoutResult =await testLogout(testUsers[0].userId);
  //     if(testLogoutResult.success){
  //       setIsTestLogout(false);
  //       setIsTestDelete(true);
  //     }
  //   }

  //   const testDeleteResult =async () => {
  //     console.log("start to test delete");
  //     await testLogin(testUsers[0].userId);
  //     const testDeleteResult =await deleteUser(testUsers[0].userId);
  //     if(testDeleteResult.success){
  //       setIsTestDelete(false);
  //       setIsFinish(true);
  //     }
  //   }

  //   if(isTestLogin){
  //     testLoginResult();
  //   }
  //   if(isTestLogout){
  //     testLogoutResult();
  //   }
  //   if(isTestDelete){
  //     testDeleteResult();
  //   }
  // },[isTestLogin,isTestLogout,isTestDelete,isFinish,isLoginout,isDelete]);

  const [testStart,setTestStart] = useState(false);
  const [testState,setTestState] = useState(0);

  useEffect(()=>{
    const testUser =async () => {
      console.log("testState===============> ",testState);
    switch(testState){
      case 0:
        if(testStart){
          
          if(loginState.logined){
            await logout();
          }
          setTestStart(false);
          setTestUsers([]);
          setTestState(1);
        }
        break;
      case 1:
        if(!loginState.logined){
          console.log("start to create user");
          const createUserResult = await createUser(1);
          if(createUserResult.success){
            setTestState(2);
          }
          else{
            console.log("create user failed");
            setTestState(0);
          }
        }
        break;
      case 2:
        if(testUsers.length>0){
          const testLoginResult =await testLogin(testUsers[0].userId);
            setTestState(3);
          
        }
        break;
      case 3:
        if(loginState.logined){
          await testLogout(testUsers[0].userId);
          setTestState(4);
        }
        break;
      case 4:
        if(!loginState.logined){
          await testLogin(testUsers[0].userId);
          setTestState(5);
        }
        break;
      case 5:
        if(loginState.logined){
          await deleteUser(testUsers[0].userId);
          setTestState(6);
        }
        break;
      case 6:
        if(!loginState.logined){
          setIsFinish(true);
        }
        break;
    }
  }
  testUser();
  },[loginState.logined,testState,testStart,testUsers]);
    
  const testUser = useCallback(async (): Promise<void> => {
        setTestStart(true);
        setTestState(0);
  }, []);

  const createUser = useCallback(async (num: number) => {
    const createdUsersIds: number[] = [];
    const newUsers: TestUserInstance[] = [];

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
          
          newUsers.push(newTestUser);
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

    setTestUsers([...testUsers, ...newUsers]);
    
    return { 
      success: true, 
      usersIds: createdUsersIds,
      users: [...testUsers, ...newUsers]
    };
  }, [generateTestCredentials, addTestResult, registerMutation, testUsers]);

  const testLogin = useCallback(async (userId: number) => {
    const targetUser = userId 
      ? testUsers.find(u => u.userId === userId)
      : testUsers[0];

    if (!targetUser) {
      return { success: false, message: 'No test user available' };
    }

    try {
      await login({
        email: targetUser.credentials.email,
        password: targetUser.credentials.password
      });

    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }, [loginState.logined, loginState.error, login, testUsers]);

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
      // await logout();
      await new Promise<void>((resolve, reject) => {
        logout().then(() => resolve()).catch((error) => reject(error));
      });
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
    testUser,
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




