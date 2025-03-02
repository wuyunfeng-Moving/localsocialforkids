import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import UserForm from "@/app/itemSubmit/user/adduserinfo";
import UserInfoScreen from "@/app/itemSubmit/user/userinfo";
import { useWebSocket } from '@/app/context/WebSocketProvider';
import { router } from 'expo-router';

const AccountSwitcher = () => {
    const { serverData} = useWebSocket();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleAccountSwitch = async (token: string) => {
        await serverData.setCurrentToken(token);
        setIsDropdownOpen(false);
    };

    const handleAddAccount = () => {
        router.push("../itemSubmit/user/login");
    };

    return (
        <View style={styles.accountSwitcherContainer}>
            <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <Text style={styles.dropdownButtonText}>
                    切换账号 ({serverData.accounts.length})
                </Text>
                <FontAwesome 
                    name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#333" 
                />
            </TouchableOpacity>

            {isDropdownOpen && (
                <View style={styles.dropdownContent}>
                    {serverData.accounts.map((account, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.accountItem,
                                account.token === serverData.token && styles.activeAccount
                            ]}
                            onPress={() => handleAccountSwitch(account.token)}
                        >
                            <Text style={[
                                styles.accountEmail,
                                account.token === serverData.token && styles.activeAccountText
                            ]}>
                                {account.email}
                            </Text>
                            {account.token === serverData.token && (
                                <FontAwesome name="check" size={16} color="#007AFF" />
                            )}
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.addAccountButton}
                        onPress={handleAddAccount}
                    >
                        <FontAwesome name="plus" size={16} color="#007AFF" />
                        <Text style={styles.addAccountText}>添加新账号</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default function UserScreen() {
    const [isAddingKid, setIsAddingKid] = useState(false);

    const { loginState, userEvents,logout,userInfo, serverData } = useWebSocket();

    useEffect(() => {
        if (!loginState.logined) {
        }
    }, [loginState]);

    const handleLogout = () => {
        logout();
    };

    const renderUserInfoWithPhoto = () => (
        <View style={styles.section}>
            <UserInfoScreen />
        </View>
    );

    const renderFollowingSection = () => (
        <TouchableOpacity 
            style={styles.section} 
            onPress={() => router.push("../user/following")}
        >
            <View style={styles.sectionHeader}>
                {/* <FontAwesome name="users" size={24} color="#007AFF" style={styles.sectionIcon} /> */}
                <Text style={styles.sectionTitle}>我的关注:{userInfo?.following.length}</Text>
            </View>
            {/* <Text style={styles.sectionSubtitle}>查看您关注的用户</Text> */}
        </TouchableOpacity>
    );

    const renderFollowerSection = () => (
        <TouchableOpacity 
            style={styles.section} 
            onPress={() => router.push("../user/followers")}
        >
            <Text style={styles.sectionTitle}>我的粉丝:{userInfo?.followers.length}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {userInfo && userInfo.email? (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    <AccountSwitcher />
                    {renderUserInfoWithPhoto()}
                    {renderFollowingSection()}
                    {renderFollowerSection()}
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
    accountSwitcherContainer: {
        marginBottom: 16,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownContent: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginTop: 4,
        zIndex: 1000,
        elevation: 5,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    activeAccount: {
        backgroundColor: '#f0f9ff',
    },
    accountEmail: {
        fontSize: 16,
        color: '#333',
    },
    activeAccountText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    addAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },
    addAccountText: {
        fontSize: 16,
        color: '#007AFF',
    },
});
