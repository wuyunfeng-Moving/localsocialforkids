import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Button, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import UserForm from "../itemSubmit/user/adduserinfo";
import UserInfoScreen from "../itemSubmit/user/userinfo";
import LoginScreen from '../itemSubmit/user/login';
import { useWebSocket } from '../context/WebSocketProvider';
import EventDisplay from '../itemSubmit/listEvent/eventdisplay';

const EventList = ({ events, onClose }) => (
    
  <View style={styles.detailContainer}>
    <EventDisplay eventDetailsArray ={events}/>
    <Button title="返回" onPress={onClose} />
  </View>
);

export default function UserScreen() {
    const [isLoginning, setIsLoginning] = useState(false);
    const [isAddingKid, setIsAddingKid] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    const { loginState, send, userEvents, kidEvents } = useWebSocket();

    useEffect(() => {
        if (!loginState.logined) {
            console.log("User logged out");
        } else {
            console.log("User logged in");
            console.log("User events:", userEvents);
            console.log("Kid events:", kidEvents);
        }
    }, [loginState, userEvents, kidEvents]);

    const handleLogout = () => {
        send({ type: 'logout' });
    };

    const renderSection = (title, onPress) => (
        <TouchableOpacity style={styles.section} onPress={onPress}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>点击查看详情</Text>
        </TouchableOpacity>
    );

    const renderSectionContent = () => {
        switch (activeSection) {
            case "用户信息":
                return (
                    <View style={styles.detailContainer}>
                        <UserInfoScreen />
                        <Button title="返回" onPress={() => setActiveSection(null)} />
                    </View>
                );
            case "我创建的事件":
                console.log("Rendering user events:", userEvents);
                return <EventList events={userEvents} onClose={() => setActiveSection(null)} />;
            case "我参与的事件":
                console.log("Rendering kid events:", kidEvents);
                return <EventList events={kidEvents} onClose={() => setActiveSection(null)} />;
            default:
                return null;
        }
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
                    {renderSection("用户信息", () => setActiveSection("用户信息"))}
                    {renderSection("我创建的事件", () => setActiveSection("我创建的事件"))}
                    {renderSection("我参与的事件", () => setActiveSection("我参与的事件"))}
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
            <Modal visible={!!activeSection} animationType="slide">
                {renderSectionContent()}
            </Modal>
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
    section: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        marginVertical: 10,
        borderRadius: 5,
        width: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    detailContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    eventItem: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        marginTop: 10,
    },
});