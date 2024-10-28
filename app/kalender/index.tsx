import React from 'react';
import { Calendar } from 'react-native-calendars';
import { View } from 'react-native';

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
}

const MyCalendar = ({ events }: { events: CalendarEvent[] }) => {
  // Convert events to the format expected by react-native-calendars
  const markedDates = events.reduce((acc, event) => {
    try {
      // Ensure we have a valid date
      if (!(event.start instanceof Date) || isNaN(event.start.getTime())) {
        console.warn('Invalid date found:', event);
        return acc;
      }
      
      const dateStr = event.start.toISOString().split('T')[0];
      acc[dateStr] = { marked: true, dotColor: '#50cebb' };
    } catch (error) {
      console.warn('Error processing event:', event, error);
    }
    return acc;
  }, {} as Record<string, { marked: boolean; dotColor: string }>);

  return (
    <View style={{ height: 500 }}>
      <Calendar
        markedDates={markedDates}
        // Theme customization
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: '#00adf5',
          monthTextColor: '#2d4150',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16
        }}
      />
    </View>
  );
};

export default MyCalendar;
