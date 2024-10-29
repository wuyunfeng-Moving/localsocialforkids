
import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';

const useIndex = (() => {
    //myEvent,recommanded,search
    const [activeTab, setActiveTab] = useState('myEvent');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMoreEvents, setHasMoreEvents] = useState(true);
    const [loadMoreEvents, setLoadMoreEvents] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    return (
        {
            activeTab,
            setActiveTab,
            isRefreshing,
            hasMoreEvents,
            setLoadMoreEvents,
            isLoadingMore,
        }
    )

})

export default useIndex;
