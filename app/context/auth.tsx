// 维护多个用户登录状态

import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { BASE_URL } from './config';
import {
      LoginResponse,
      isLoginResponse,
      RegisterResponse,
      OtherUserInfoResponse,
      KidInfoResponse,
      NotificationResponse,
} from '../types/types';

interface AuthType {
    accounts: {email: string, token: string}[];
    currentToken:string;
    switchAccount: (token: string) => Promise<boolean>;
    login: (params: {email: string, password: string}) => Promise<void>;
    register: (params: {email: string, password: string}) => Promise<void>;
    logout: () => Promise<void>;
}

export const authManager = ():AuthType => {
    const [accounts, setAccounts] = useState<{email: string, token: string}[]>([]);
    const [currentToken, setCurrentToken] = useState<string>("");

    useEffect(() => {
        const initializeAuth = async () => {
            const savedAccounts = await SecureStore.getItemAsync('accounts');
            const savedToken = await SecureStore.getItemAsync('token');
            
            if (savedAccounts) {
                setAccounts(JSON.parse(savedAccounts));
            }
            if (savedToken) {
                setCurrentToken(savedToken);
            }
        };
        initializeAuth();
    }, []);

    const login = async (params: {email: string, password: string}) => {
        const response = await axios.post(`${BASE_URL}/login`, params);

        if (isLoginResponse(response.data)) {
            const newAccounts = [...accounts, {email: params.email, token: response.data.token}];
            console.log("newAccountsList:", newAccounts);
            setAccounts(newAccounts);
            setCurrentToken(response.data.token);
            await SecureStore.setItemAsync('token', response.data.token);
            await SecureStore.setItemAsync('accounts', JSON.stringify(newAccounts));
        }
    }

    const register = async (params: {email: string, password: string}) => {
        const response = await axios.post(`${BASE_URL}/register`, params);
    }

    const logout = async () => {
        // 删除当前账户
        const currentAccount = accounts.find(account => account.token === currentToken);
        if (currentAccount) {
            const newAccounts = accounts.filter(account => account.email !== currentAccount.email);
            setAccounts(newAccounts);
            await SecureStore.setItemAsync('accounts', JSON.stringify(newAccounts));
            //切换到第一个账号
            if (newAccounts.length > 0) {
                await switchAccount(newAccounts[0].token);
            }
        }
    }

    // 切换账号，如果切换目标是空的，则自动切换到存在的第一个账号，如果切换目标是存在的，则切换到目标账号
    const switchAccount = async (token: string) => {
        const targetAccount = accounts.find(account => account.token === token);
        if (targetAccount) {
            setCurrentToken(targetAccount.token);
            console.log("switch to account:", targetAccount.email, targetAccount.token);
            return true;
        }
        return false;
    }



    return {
        accounts,
        currentToken,
        switchAccount,
        login,
        register,
        logout,
    }
}

