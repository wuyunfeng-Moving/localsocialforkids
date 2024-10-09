import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import UserForm from "../itemSubmit/user/adduserinfo";
import UserInfoScreen from "../itemSubmit/user/userinfo";
import LoginScreen from '../itemSubmit/user/login';
import { useWebSocket } from '../context/WebSocketProvider';

export default function UserScreen() {
    const [isLoginning, setIsLoginning] = useState(false);
    const [isAddingKid, setIsAddingKid] = useState(false);

    const { loginState, send, userEvents, kidEvents } = useWebSocket();

    useEffect(() => {
        if (!loginState.logined) {
            console.log("User logged out");
        } else {
            console.log("User logged in");
            console.log("User events:", userEvents);
            console.log("Kid events:", kidEvents);
        }
    }, [loginState]);

    const handleLogout = () => {
        send({ type: 'logout' });
    };

    const renderUserInfo = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <FontAwesome name="user" size={24} color="#007AFF" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>用户信息</Text>
            </View>
            <View style={styles.userInfoContainer}>
                <UserInfoScreen />
            </View>
        </View>
    );

    const renderAddChildSection = () => (
        <TouchableOpacity style={styles.section} onPress={() => setIsAddingKid(true)}>
            <View style={styles.sectionHeader}>
                <FontAwesome name="child" size={24} color="#007AFF" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>添加小孩</Text>
            </View>
            <Text style={styles.sectionSubtitle}>点击这里添加新的小孩信息</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>用户中心</Text>
            </View>
            {loginState.logined ? (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {renderUserInfo()}
                    {renderAddChildSection()}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>登出</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View style={styles.loginContainer}>
                    <TouchableOpacity style={styles.loginButton} onPress={() => setIsLoginning(true)}>
                        <Text style={styles.loginButtonText}>请先登录</Text>
                    </TouchableOpacity>
                </View>
            )}
            <Modal visible={isLoginning} animationType="slide">
                <LoginScreen closeModal={() => {
                    console.log("onclose modal is called!!");
                    setIsLoginning(false)
                }} />
            </Modal>
            <Modal visible={isAddingKid} animationType='slide' transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <UserForm onCloseModal={() => setIsAddingKid(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        maxHeight: '80%',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#007AFF',
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: '100%', // 确保section占满整个宽度
    },
    userInfoContainer: {
        width: '100%', // 确保UserInfoScreen占满整个section宽度
        // Remove fixed height to allow content to determine the height
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionIcon: {
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    detailContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    loginButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: '#ff3b30',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 16,
        alignSelf: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});