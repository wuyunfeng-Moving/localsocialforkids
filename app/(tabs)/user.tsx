import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import UserForm from "@/app/itemSubmit/user/adduserinfo";
import UserInfoScreen from "@/app/itemSubmit/user/userinfo";
import { useWebSocket } from '@/app/context/WebSocketProvider';
import { router } from 'expo-router';

export default function UserScreen() {
    const [isAddingKid, setIsAddingKid] = useState(false);

    const { loginState, send, userEvents, kidEvents,logout,userInfo } = useWebSocket();

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
        logout();
    };

    const renderUserInfoWithPhoto = () => (
        <View style={styles.section}>
            <View style={styles.userInfoPhotoContainer}>
                <View style={styles.userInfoContainer}>
                    <UserInfoScreen />
                </View>
            </View>
        </View>
    );

    const renderMyChildrenSection = () => (
        <TouchableOpacity style={styles.section} onPress={() => {router.push('../user/kids')}}>
            <View style={styles.sectionHeader}>
                <FontAwesome name="child" size={24} color="#007AFF" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>我的孩子</Text>
            </View>
            <Text style={styles.sectionSubtitle}>查看和管理您的孩子信息</Text>
        </TouchableOpacity>
    );

    const renderFollowingSection = () => (
        <TouchableOpacity 
            style={styles.section} 
            onPress={() => router.push("../user/following")}
        >
            <View style={styles.sectionHeader}>
                <FontAwesome name="users" size={24} color="#007AFF" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>我的关注</Text>
            </View>
            <Text style={styles.sectionSubtitle}>查看您关注的用户</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {userInfo && userInfo.email? (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {renderUserInfoWithPhoto()}
                    {/* {renderMyChildrenSection()} */}
                    {renderFollowingSection()}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>登出</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View style={styles.loginContainer}>
                    <TouchableOpacity style={styles.loginButton} onPress={() => {
                        router.push("../itemSubmit/user/login")
                    }}>
                        <Text style={styles.loginButtonText}>请先登录</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    photoContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    userPhoto: {
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    userInfoPhotoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfoContainer: {
        flex: 1,
        marginRight: 16,
    },
    photoContainer: {
        alignItems: 'center',
    },
    userPhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
});
