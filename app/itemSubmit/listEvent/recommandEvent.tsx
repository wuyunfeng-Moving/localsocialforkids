import { View, Text } from "@/components/Themed";
import { ScrollView, TouchableOpacity } from "react-native";
import { useWebSocket } from "@/app/context/WebSocketProvider";
import { RecommendEvents } from "@/app/types/types";

const RecommandEvent = () => {
  const { data } = useWebSocket()||{data:{}};
  const { recommendEvents }: { recommendEvents: RecommendEvents } = data||{};


  return (
    <ScrollView>      
      {recommendEvents && recommendEvents.map((item, index) => (
        <View key={index} style={{ marginBottom: 15, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 5 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.event.topic}</Text>
          <Text>时间: {new Date(item.event.dateTime).toLocaleString()}</Text>
          <Text>地点: {`${item.event.place.location[0]}, ${item.event.place.location[1]}`}</Text>
          <Text>推荐原因: {item.reason}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default RecommandEvent;
