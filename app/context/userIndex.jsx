
import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';

const useIndex = (() => {
    //myEvent,recommanded,search
    const { userEvents, orderToServer } = useWebSocket();
    const [activeTab, setActiveTab] = useState('myEvent');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMoreEvents, setHasMoreEvents] = useState(true);
    const [loadMoreEvents, setLoadMoreEvents] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);


    //get matches at first get the userinfo
    useEffect(() => {
        orderToServer('getMatch', { start: 0, end: 10 }, (matchMessage) => {
            // Handle the matched events here
            // You might want to store these matched events in a state
            console.log('Matched events:', matchMessage);
        });
    }
        , [userEvents]);


    const onRefreshing = (() => {
        setIsRefreshing(true);
        switch (activeTab) {
            case 'myEvent':
                orderToServer('getUserEvents', {}, (message) => {
                    setIsRefreshing(() => {
                        console.log("setIsRefreshing", false);
                        return false;
                    });
                });
                break;
            case 'recommanded':
                break;
        }
    }
    );

    return (
        {
            activeTab,
            setActiveTab,
            isRefreshing,
            onRefreshing,
            hasMoreEvents,
            setLoadMoreEvents,
            isLoadingMore,
        }
    )

})

export default useIndex;
