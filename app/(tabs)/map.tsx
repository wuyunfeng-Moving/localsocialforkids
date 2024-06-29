// import React, { useState, useEffect } from 'react';
// import { StyleSheet } from 'react-native';
// import * as Location from 'expo-location';
// import MapView, { Marker } from 'react-native-maps';
// import { Text, View } from '@/components/Themed';

// export default function MapScreen() {
//   const [initialRegion, setInitialRegion] = useState(null);

//   useEffect(() => {
//     (async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         console.log('Permission to access location was denied');
//         return;
//       }

//       let location = await Location.getCurrentPositionAsync({});
//       const { latitude, longitude } = location.coords;
//       setInitialRegion({
//         latitude,
//         longitude,
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//       });
//     })();
//   }, []);

//   return (
//     <View style={styles.container}>
//       {initialRegion ? (
//         <MapView
//           style={styles.map}
//           initialRegion={initialRegion}
//         >
//           <Marker
//             coordinate={initialRegion}
//             title="Your Location"
//             description="This is where you are"
//           />
//         </MapView>
//       ) : (
//         <Text>Loading...</Text>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     flex: 1,
//   },
// });
