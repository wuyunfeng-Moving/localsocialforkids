import {UserInfo,Event,KidInfo,isUserInfo,isEvent} from "./baseType"
import {Notification,isNotification} from "./notification_types"


export interface WebSocketMessageFromServer {
    type: string; 
    [key: string]: any;
}

export const isWebSocketMessageFromServer = (message: any): message is WebSocketMessageFromServer => {
    return typeof message.type === 'string' && typeof message.success === 'boolean';
};



export type ChatMessage = {
    id: number;
    userId: number;
    content: string;
    timestamp: string;
};

const isChatMessage = (chatMessage: any): chatMessage is ChatMessage => {
    return typeof chatMessage.id === 'number' &&
        typeof chatMessage.userId === 'number' &&
        typeof chatMessage.content === 'string' &&
        typeof chatMessage.timestamp === 'string' &&
        (chatMessage.read === undefined || typeof chatMessage.read === 'boolean');
};

type ChatMessagesArray = {
    chatId:number;
    messages:ChatMessage[];
}[];

export type LoginState = {
    logined: boolean;
    error: 'No token' | 'Token expired' | string;
};

interface UserData {
    userInfo: UserInfo;
    userEvents: Event[];
    notifications: Notification[];
 }

 const isUserData = (userData: UserData): userData is UserData => {
    return isUserInfo(userData.userInfo) &&
        Array.isArray(userData.kidEvents) && userData.kidEvents.every((kidEvent: any) => isEvent(kidEvent)) &&
        Array.isArray(userData.userEvents) && userData.userEvents.every((userEvent: any) => isEvent(userEvent)) &&
        Array.isArray(userData.notifications) && userData.notifications.every((notification: any) => isNotification(notification));
};

export interface BaseResponse {
    success: boolean;
    message?: string;
}

export const isBaseResponse = (response: BaseResponse): response is BaseResponse => {
    console.log('Validating BaseResponse:', response);
    const isValid = typeof response.success === 'boolean' && 
        (response.message === undefined || typeof response.message === 'string');
    console.log('BaseResponse validation result:', isValid);
    return isValid;
};

export interface LoginResponse extends BaseResponse {
    token: string;
    userData: {
        userInfo: UserInfo;
        userAllEvents: Event[];
        notifications: Notification[];
    };
}

export const isLoginResponse = (response: LoginResponse): response is LoginResponse => {
    console.log('Validating LoginResponse:', response);
    
    const isBaseResponseValid = isBaseResponse(response);
    console.log('isBaseResponse check:', isBaseResponseValid);
    
    const isTokenValid = typeof response.token === 'string';
    console.log('isToken check:', isTokenValid);
    
    let isUserDataValid = false;
    if (!response.success) {
        isUserDataValid = true;
    } else {
        console.log('Checking UserInfo:', response.userData.userInfo);
        const hasUserInfo = isUserInfo(response.userData.userInfo);
        const hasValidEvents = Array.isArray(response.userData.userAllEvents);
        const hasValidEventItems = hasValidEvents && response.userData.userAllEvents.every((event: any) => isEvent(event));
        
        console.log('UserInfo structure:', {
            email: typeof response.userData.userInfo.email,
            followers: Array.isArray(response.userData.userInfo.followers),
            following: Array.isArray(response.userData.userInfo.following),
            id: typeof response.userData.userInfo.id,
            kidinfo: Array.isArray(response.userData.userInfo.kidinfo),
            username: typeof response.userData.userInfo.username
        });
        console.log('UserInfo check:', hasUserInfo);
        console.log('Events array check:', hasValidEvents);
        console.log('Events items check:', hasValidEventItems);
        
        isUserDataValid = hasUserInfo && hasValidEvents && hasValidEventItems;
    }
    console.log('UserData check:', isUserDataValid);
    
    const isValid = isBaseResponseValid && isTokenValid && isUserDataValid;
    console.log('LoginResponse validation result:', isValid);
    return isValid;
};

export interface SearchEventsResponse extends BaseResponse {
    events?: Event[];
}

export const isSearchEventsResponse = (response: SearchEventsResponse): response is SearchEventsResponse => {
    return isBaseResponse(response) && 
        (!response.success || (Array.isArray(response.events)));
};

export interface ChangeEventResponse extends BaseResponse {
    event?: Event;
    updatedUserInfo?: UserInfo;
}

export const isChangeEventResponse = (response: ChangeEventResponse): response is ChangeEventResponse => {
    return isBaseResponse(response) && 
        (response.event === undefined || typeof response.event === 'object') &&
        (response.updatedUserInfo === undefined || typeof response.updatedUserInfo === 'object');
};

export interface NotificationResponse extends BaseResponse {
    notifications?: Notification[];
}

export const isNotificationResponse = (response: NotificationResponse): response is NotificationResponse => {
    return isBaseResponse(response) && 
        (response.notifications === undefined || Array.isArray(response.notifications));
};

export interface KidInfoResponse extends BaseResponse {
    kidInfo?: KidInfo;
}

export const isKidInfoResponse = (response: KidInfoResponse): response is KidInfoResponse => {
    return isBaseResponse(response) && 
        (response.kidInfo === undefined || typeof response.kidInfo === 'object');
};

export interface UserDataResponse extends BaseResponse {
    data: UserData;
}

export const isUserDataResponse = (response: UserDataResponse): response is UserDataResponse => {
    return isBaseResponse(response) && 
        (!response.success || isUserData(response.data));
};


