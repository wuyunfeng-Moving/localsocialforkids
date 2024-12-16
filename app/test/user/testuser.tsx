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

enum TestState{
  Idle = "idle",
  CheckLogoutBeforeTest = "checklogoutbeforetest",
  CreateUser = "createuser",
  LoginIn = "loginin",
  Logout = "logout",
  LoginInAgain = "logininagain",
  DeleteUser = "deleteuser"
}

enum TestAction{
  CheckLogoutBeforeTest = "checklogoutbeforetest",
  CreateUser = "createuser",
  LoginIn_First = "loginin_first",
  CreateKid = "createkid",
  CreateEvent = "createevent",
  Logout_First = "logout_first",
  LoginIn_Second = "loginin_second",
  CreateKid_Second = "createkid_second",
  SearchEvent = "searchevent",
  SignEvent = "signevent",
  AddComment = "addcomment",
  Logout_Second = "logout_second",
  Login_First_Again = "login_first_again",
  CheckNotification = "checknotification",
  ApproveEvent = "approveevent",
  AddComment_byFirst = "addcomment_byfirst",
  Logout_First_Second = "logout_first_second",
  Login_Second_Again = "login_second_again",
  CheckParticipate = "checkparticipate",
  CheckComment = "checkcomment",
  CheckNotification_Second = "checknotification_second",
  QuitEvent = "quitevent",
  DeleteUser = "deleteuser",
  Login_First_Third = "login_first_third",
  DeleteUser_Second = "deleteuser_second"
}



export const TestUser = (): TestUserMethods => {
  const {
    registerMutation,
    login,
    loginState,
    logout,
    update: { updateUserInfo }
  } = useWebSocket();

  const [testActions_State, setTestActions_State] = useState<TestAction>(TestAction.CheckLogoutBeforeTest);
  const [testAction_true, setTestAction_true] = useState(false);
  const [testUsers, setTestUsers] = useState<TestUserInstance[]>([]);

  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = useCallback((result: TestResult) => {
    setTestResults(prev => [...prev, result]);
    console.log(`Test Result: ${result.testName} - ${result.status} - ${result.message || ''}`);
  }, []);

  const generateTestCredentials = useCallback((index: number) => ({
    email: `test${Date.now()}_${index}@example.com`,
    password: 'password123',
    username: `TestUser${Date.now()}_${index}`
  }), []);


  const [testStart,setTestStart] = useState(false);
  const [testState,setTestState] = useState(TestState.Idle);


  useEffect(()=>{

    if(!testAction_true){
      return;
    }

    const testAction = async () => {

    switch(testActions_State)
    {
      case TestAction.CheckLogoutBeforeTest:
        if(loginState.logined){
          logout();
        }
        setTestActions_State(TestAction.CreateUser);
        break;
      case TestAction.CreateUser:
        if(!loginState.logined)
        {
          const result =await createUser(2);
          if(result.success){
            setTestActions_State(TestAction.LoginIn_First);
          }
        }
        break;
      case TestAction.LoginIn_First:
        if(!loginState.logined)
        {
          const result =await testLogin(testUsers[0].userId);
          if(result.success){
            setTestActions_State(TestAction.DeleteUser);
          }
        }
        break;
      case TestAction.CreateKid:
        if(loginState.logined)
        {
          const result =await createKid(testUsers[0].userId);
        }
      
    };

    console.log("testAction state: ====>>>",testActions_State);
    await testAction();
  }

  },[testAction_true,testActions_State]);

  // 测试用户流程
  useEffect(()=>{
    if(testStart){
      const testActionResult =async () => {
        switch(testState){
        case TestState.CheckLogoutBeforeTest:
          if(loginState.logined){
            logout();
            setTestState(TestState.CreateUser);
          }
          break;
        case TestState.CreateUser:
          if(!loginState.logined)
          {
            const result =await createUser(1);
            if(result.success){
              setTestState(TestState.LoginIn);
            } 
          }
          break;
        case TestState.LoginIn:
          if(!loginState.logined)
          {
            const result =await testLogin(testUsers[0].userId);
            if(result.success){
              setTestState(TestState.DeleteUser);
            }
          }
          break;
        case TestState.DeleteUser:
          if(loginState.logined)
          {
            const result =await deleteUser(testUsers[0].userId);
            if(result.success){
              console.log("user test finish,success~");
              setTestState(TestState.Idle);
              setTestStart(false);
            }
          }
          break;
        }
      }
      testActionResult();
    }
  },[testState,testStart,loginState.logined]);
    
  const testUser = useCallback(async (): Promise<void> => {
    setTestStart(true);
    setTestState(TestState.CheckLogoutBeforeTest);
  }, []);

  const startAction_Test = useCallback(() => {
    setTestAction_true(true);
  }, []);

  const createUser = useCallback(async (num: number):Promise<{ success: boolean, usersIds: number[], users: TestUserInstance[] }> => {
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
      
      return { success: true, message: '登录成功' };

    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }, [loginState.logined, login, testUsers]);

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




