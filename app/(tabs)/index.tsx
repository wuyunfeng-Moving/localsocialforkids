import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { FilterCondition } from '../itemSubmit/listEvent/filterCondition';
import EventDisplay from '../itemSubmit/listEvent/eventdisplay';
import { useWebSocket } from '../context/WebSocketProvider';

const EventList = ({ events, userInfo }) => (
  <View style={styles.detailContainer}>
    {events.length > 0 ? (
      <EventDisplay eventDetailsArray={events} userInfo={userInfo} />
    ) : (
      <Text style={styles.noEventsText}>没有找到符合条件的活动</Text>
    )}
  </View>
);

const TABS = [
  { 
    id: 'participated', 
    title: '我参与的活动',
    render: (props) => <EventList events={props.kidEvents} userInfo={props.userInfo} />
  },
  { 
    id: 'initiated', 
    title: '我发起的活动',
    render: (props) => <EventList events={props.userEvents} userInfo={props.userInfo} />
  },
  { 
    id: 'search', 
    title: '搜索活动',
    render: (props) => <EventList events={props.filteredEvents} userInfo={props.userInfo} />
  },
  { 
    id: 'recommended', 
    title: '推荐的活动',
    render: (props) => <EventList events={props.recommendedEvents} userInfo={props.userInfo} />
  },
];

export default function TabOneScreen() {
  const [activeTab, setActiveTab] = useState('participated');
  const [filterState, setFilterState] = useState({
    selectedDistance: 3000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isRefreshing: false,
    eventList: [],
  });

  const { send, userInfo, kidEvents, userEvents } = useWebSocket();
  const isInitialMount = useRef(true);

  const handleFilterChange = useCallback((newFilterState) => {
    setFilterState(prevState => ({ ...prevState, ...newFilterState }));
  }, []);

  const fetchEvents = useCallback(() => {
    if (!userInfo || !userInfo.id) return;
    setFilterState(prev => ({ ...prev, isRefreshing: true }));
    const request = {
      type: 'getEvents',
      filter: {
        tab: activeTab,
        userId: userInfo.id,
        distance: filterState.selectedDistance,
        startDate: filterState.startDate,
        endDate: filterState.endDate,
      }
    };
    send(request);
  }, [activeTab, userInfo, send, filterState]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else if (activeTab === 'search' && userInfo?.id) {
      fetchEvents();
    }
  }, [activeTab, fetchEvents, userInfo]);

  const renderTabContent = () => {
    const currentTab = TABS.find(tab => tab.id === activeTab);
    
    if (activeTab === 'search') {
      return (
        <>
          <FilterCondition 
            onFilterChange={handleFilterChange} 
            // onSearch={fetchEvents}
            initialValues={filterState}
          />
          
          {filterState.isRefreshing ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              {currentTab?.render({
                filteredEvents: filterState.eventList,
                userInfo: userInfo
              })}
            </ScrollView>
          )}
        </>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {currentTab?.render({
          kidEvents,
          userEvents,
          recommendedEvents: [], // Add recommended events data when available
          userInfo: userInfo
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab.id && styles.activeTabButtonText]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    color: '#333',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  detailContainer: {
    flex: 1,
  },
  noEventsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});