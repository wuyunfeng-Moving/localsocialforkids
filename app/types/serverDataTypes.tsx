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
    userAllEvents: Event[];
    notifications: Notification[];
 }

 const isUserData = (userData: UserData): userData is UserData => {
    return isUserInfo(userData.userInfo) &&
        Array.isArray(userData.userAllEvents) && userData.userAllEvents.every((userEvent: any) => isEvent(userEvent)) &&
        Array.isArray(userData.notifications) && userData.notifications.every((notification: any) => isNotification(notification));
};

export interface BaseResponse {
    success: boolean;
    message?: string;
}

export const isBaseResponse = (response: BaseResponse): response is BaseResponse => {
    // console.log('Validating BaseResponse:', response);
    const isValid = typeof response.success === 'boolean' && 
        (response.message === undefined || typeof response.message === 'string');
    // console.log('BaseResponse validation result:', isValid);
    return isValid;
};

export interface LoginResponse extends BaseResponse {
    token: string;
    userInfo: UserInfo;
}

export const isLoginResponse = (response: LoginResponse): response is LoginResponse => {
    console.log('Validating LoginResponse:', response);
    
    const isBaseResponseValid = isBaseResponse(response);
    console.log('isBaseResponse check:', isBaseResponseValid);
    
    const isTokenValid = typeof response.token === 'string';
    console.log('isToken check:', isTokenValid);

    const isUserInfoValid = isUserInfo(response.userInfo);
    console.log('isUserInfo check:', isUserInfoValid);
    
    return isBaseResponseValid && isTokenValid && isUserInfoValid;
};

export interface GetEventsResponse extends BaseResponse {
    events?: Event[];
}

export const isGetEventsResponse = (response: GetEventsResponse): response is GetEventsResponse => {
    return isBaseResponse(response) && (!response.success || (Array.isArray(response.events)));
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
    userInfo: UserInfo;
    userAllEvents: Event[];
    notifications: Notification[];
}

export const isUserDataResponse = (response: any): response is UserDataResponse => {
    console.log('Validating UserDataResponse:', response);
    
    if (!isBaseResponse(response)) {
        console.log('Failed: not a valid base response');
        return false;
    }

    if (!response.userInfo || !isUserInfo(response.userInfo)) {
        console.log('Failed: invalid userInfo');
        return false;
    }

    if (!Array.isArray(response.userAllEvents)) {
        console.log('Failed: userAllEvents is not an array');
        return false;
    }

    if (!Array.isArray(response.notifications)) {
        console.log('Failed: notifications is not an array');
        return false;
    }

    console.log('UserDataResponse validation passed');
    return true;
};


