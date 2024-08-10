import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Button, StyleSheet } from 'react-native';
import UserForm from "../itemSubmit/user/adduserinfo";
import UserInfoScreen from "../itemSubmit/user/userinfo";
import LoginScreen from '../itemSubmit/user/login';
import { useWebSocket } from '../context/WebSocketProvider';

export default function UserScreen() {
    const [isLoginning, setIsLoginning] = useState(false);
    const [isAddingKid, setIsAddingKid] = useState(false);

    const { loginState, send } = useWebSocket();

    useEffect(() => {
        if (!loginState.logined) {
            // User has logged out, you might want to do something here
            // For example, show a message or redirect
            console.log("User logged out");
        }
    }, [loginState]);

    const handleLogout = () => {
        send({ type: 'logout' });
    };

    return (
        <View style={styles.container}>
            <Modal visible={isLoginning}>
                <LoginScreen closeModal={() => {
                    console.log("onclose modal is called!!");
                    setIsLoginning(false)
                }
                } />
            </Modal>
            <Text style={styles.title}>用户信息</Text>
            {loginState.logined ? (
                <>
                    <UserInfoScreen />
                    <Button
                        title="登出"
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    />
                </>
            ) : (
                <Button
                    title="请先登录"
                    onPress={() => setIsLoginning(true)}
                />
            )}
            <Modal visible={isAddingKid}>
                <UserForm onCloseModal={() => setIsAddingKid(false)} />
            </Modal>
            <Button title="添加小孩" onPress={() => setIsAddingKid(true)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    logoutButton: {
        marginTop: 10,
    },
});