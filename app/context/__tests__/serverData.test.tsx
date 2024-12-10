import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useServerData } from '../serverData';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Create a wrapper component with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useServerData', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default SecureStore mock implementation
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => useServerData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loginState.logined).toBe(false);
    expect(result.current.userInfo).toBeUndefined();
    expect(result.current.notifications).toEqual([]);
    expect(result.current.userEvents).toEqual([]);
    expect(result.current.kidEvents).toEqual([]);
  });

  it('should handle login successfully', async () => {
    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'fake-token',
        message: 'Login successful'
      }
    });

    const { result } = renderHook(() => useServerData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'fake-token');
  });

  it('should handle login failure', async () => {
    // Mock failed login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Invalid credentials'
      }
    });

    const { result } = renderHook(() => useServerData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.login({
        email: 'test@example.com',
        password: 'wrong-password'
      });
    });

    expect(result.current.loginState.logined).toBe(false);
    expect(result.current.loginState.error).toBeTruthy();
  });

  it('should handle logout', async () => {
    // Mock successful logout response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Logged out successfully'
      }
    });

    const { result } = renderHook(() => useServerData(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.logout();
    });

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
    expect(result.current.loginState.logined).toBe(false);
  });

  it('should handle search events', async () => {
    // Mock successful search response
    const mockEvents = [
      {
        id: 1,
        topic: 'Test Event',
        // ... other event properties
      }
    ];

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        events: mockEvents
      }
    });

    const { result } = renderHook(() => useServerData(), {
      wrapper: createWrapper(),
    });

    const callback = jest.fn();

    await act(async () => {
      await result.current.searchEvents.search({
        keyword: 'test',
        callback
      });
    });

    expect(callback).toHaveBeenCalledWith(true, '', mockEvents);
    expect(result.current.searchEvents.results).toEqual(mockEvents);
  });

  // Add more test cases for other functionalities...
}); 