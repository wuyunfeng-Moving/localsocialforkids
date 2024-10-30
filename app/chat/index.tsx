import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '../context/WebSocketProvider';
import { Event, ChatMessage } from '../types/types';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const { comingChatId, eventId } = params;
  const { searchEvents, chat, userInfo } = useWebSocket();
  const [event, setEvent] = useState<Event | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<number | null>(comingChatId ? Number(comingChatId) : null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch event details and chat history when component mounts
  useEffect(() => {
    searchEvents.search({
      eventId: Number(eventId),
      callback: (events) => {
        if (events.length > 0) {
          setEvent(events[0]);
        }
      }
    });

    if (comingChatId) {
      // If comingChatId is provided, directly fetch chat history
      const chatIdNum = Number(comingChatId);
      setChatId(chatIdNum);
      chat.getChatHistory(chatIdNum, (success, messages: ChatMessage[]) => {
        console.log("getChatHistory", messages);
        setMessages(messages);
      });
    } else if (eventId) {
      chat.createChat({
        eventId: Number(eventId),
        callback: (success, message, chatId) => {
          console.log("createChat", success, message, chatId);
          setChatId(chatId);
          if (success) {
            chat.getChatHistory(chatId, (success, messages: ChatMessage[]) => {
              console.log("getChatHistory", messages);
              setMessages(messages);
            });
          }
        }
      });
    }
  }, [eventId, comingChatId]);

  const handleSend = () => {
    if (!message.trim() || !eventId) return;

    chat.sendMessage({
      chatId: chatId || 0,
      message: message.trim(),
      callback: (success, responseMessage) => {
        if (success) {
          setMessage('');
          // Optionally refresh chat history after sending
          chat.getChatHistory(chatId || 0, (success, messages: ChatMessage[]) => {
            if (success) {
              setMessages(messages);
            }
          });
        } else {
          console.error('Failed to send message:', responseMessage);
        }
      }
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.userId === userInfo?.id;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.userId || '用户'}</Text>
        )}
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>{item.content}</Text>
        <Text style={[
          styles.timestamp,
          isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
        ]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: '#f5f5f5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.mainContainer}>
        {event && (
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.topic}</Text>
            <Text style={styles.eventInfo}>{event.dateTime} | {event.place.location}</Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="输入消息..."
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Text style={styles.sendButtonText}>发送</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  eventHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
    padding: 10,
    marginTop: 70,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 6,
    padding: 12,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
