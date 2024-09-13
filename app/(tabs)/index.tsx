import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { FilterCondition } from '../itemSubmit/listEvent/filterCondition';
import EventDisplay from '../itemSubmit/listEvent/EventListDisplay';
import myEventDisplay from '../itemSubmit/listEvent/myEventDisplay';
import { useWebSocket } from '../context/WebSocketProvider';
import useIndex from '../context/userIndex';


const getFormattedTime = () => {
  const now = new Date();
  return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};

const EventList = ({ events, userInfo }) => (
  <View style={styles.detailContainer}>
    {events.length > 0 ? (
      <EventDisplay eventDetailsArray={events}  />
    ) : (
      <Text style={styles.noEventsText}>没有找到符合条件的活动</Text>
    )}
  </View>
);



const TABS = [
  // { 
  //   id: 'participated', 
  //   title: '参与的活动',
  //   render: myEventDisplay
  // },
  { 
    id: 'myEvent', 
    title: '我的活动',
     render: myEventDisplay
  },
  { 
    id: 'recommended', 
    title: '推荐活动',
    render: (props) => <EventList events={props.recommendedEvents} userInfo={props.userInfo} />
  },
  { 
    id: 'search', 
    title: '搜索活动',
    render: (props) => <EventList events={props.filteredEvents} userInfo={props.userInfo} />
  },

];

const parseMatchedEvents = (message) => {
  if (message.success && Array.isArray(message.matches)) {
    return message.matches.map(match => ({
      score: match.score,
      event: match.event
    }));
  }
  return [];
};

export default function TabOneScreen() {
  const { userInfo, kidEvents: nestedKidEvents, userEvents, matchedEvents} = useWebSocket();

  const {activeTab,setActiveTab,
    isRefreshing,onRefreshing,
    hasMoreEvents,setLoadMoreEvents,isLoadingMore
} = useIndex();

  const kidEvents = nestedKidEvents.flat();

  const renderTabContent = () => {
    const currentTab = TABS.find(tab => tab.id === activeTab);
    if (!currentTab) return null;

    const props = {
      kidEvents,
      userEvents,
      recommendedEvents: matchedEvents ? Object.values(matchedEvents)
        .flat()
        .filter(event => event && event.event)
        .sort((a, b) => b.score - a.score)
        .map(item => ({
          ...item.event,
          score: item.score
        }))
      : []
    };

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefreshing} />
        }
      >
        {currentTab.render(props)}
        {activeTab === 'recommended' && hasMoreEvents && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={()=>setLoadMoreEvents(true)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.loadMoreButtonText}>加载更多</Text>
            )}
          </TouchableOpacity>
        )}
        {activeTab === 'recommended' && !hasMoreEvents && (
          <Text style={styles.noMoreEventsText}>所有活动已经加载完毕</Text>
        )}
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
      
      {userInfo ? (
        renderTabContent()
      ) : (
        <Text style={styles.loadingText}>正在加载用户信息...</Text>
      )}
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
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  loadMoreButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  loadMoreButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  noMoreEventsText: {
    textAlign: 'center',
    color: '#666',
    padding: 10,
    fontSize: 16,
  },
});