import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useWebSocket } from '../../context/WebSocketProvider';
import { Event } from "@/app/types/types";
import { SingleEventDisplay } from './singleEventDisplay';
import { router } from 'expo-router';
interface MyEventDisplayProps {
  kidEvents: Event[];
  userEvents: Event[];
}

const MyEventDisplay: React.FC<MyEventDisplayProps> = ({ kidEvents, userEvents }) => {
    const { userInfo } = useWebSocket();

    // 合并事件并去重
    const combinedEvents = React.useMemo(() => {
        // console.log('原始 kidEvents:', kidEvents);
        // console.log('原始 userEvents:', userEvents);

        const allEvents = [...kidEvents, ...userEvents];
        // console.log('合并后的数组:', allEvents);

        // 使用 Set 和 Map 去重，以事件 ID 为唯一标识
        const uniqueEvents = Array.from(
            new Map(allEvents.map(event => [event.id, event])).values()
        );
        // console.log('去重后的数组:', uniqueEvents);

        // 按开始时间降序排序（从近到远）
        const sortedEvents = uniqueEvents.sort((a, b) => 
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );
        // console.log('排序后的数组:', sortedEvents);

        return sortedEvents;
    }, [kidEvents, userEvents]);

    const handleEventPress = (event: Event) => {
      console.log("handleEventPress", event);
      router.push({
        pathname: '../events/[id]',
        params: { id: event.id, eventData: JSON.stringify(event) }  // 序列化事件对象
      });
    };

    return (
        <View style={styles.container}>
          {combinedEvents.length > 0 ? (
            combinedEvents.map((event) => (
              <TouchableOpacity onPress={() => handleEventPress(event)}>
                <SingleEventDisplay currentEvent={event} list={1} depth={0} />
              </TouchableOpacity>
            ))
          ) : (
            <Text>没有活动</Text>
          )}
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default MyEventDisplay;
