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
    kidEvents: Event[];
    userEvents: Event[];
    notifications: Notification[];
 }

 const isUserData = (userData: UserData): userData is UserData => {
    return isUserInfo(userData.userInfo) &&
        Array.isArray(userData.kidEvents) && userData.kidEvents.every((kidEvent: any) => isEvent(kidEvent)) &&
        Array.isArray(userData.userEvents) && userData.userEvents.every((userEvent: any) => isEvent(userEvent)) &&
        Array.isArray(userData.notifications) && userData.notifications.every((notification: any) => isNotification(notification));
};

 interface BaseResponse {
    success: boolean;
    message: string;
}

export const isBaseResponse = (response: BaseResponse): response is BaseResponse => {
    return typeof response.success === 'boolean' && typeof response.message === 'string';
};

interface LoginResponse extends BaseResponse {
    token: string;
    userData: UserData;
}

export const isLoginResponse = (response: LoginResponse): response is LoginResponse => {
    return isBaseResponse(response) &&
        typeof response.token === 'string' &&
        (!response.success || isUserData(response.userData));
};

interface SearchEventsResponse extends BaseResponse {
    events?: Event[];
}

export const isSearchEventsResponse = (response: SearchEventsResponse): response is SearchEventsResponse => {
    return isBaseResponse(response) && 
        (!response.success || (Array.isArray(response.events)));
};

interface ChangeEventResponse extends BaseResponse {
    event?: Event;
    updatedUserInfo?: UserInfo;
}

export const isChangeEventResponse = (response: ChangeEventResponse): response is ChangeEventResponse => {
    return isBaseResponse(response) && 
        (response.event === undefined || typeof response.event === 'object') &&
        (response.updatedUserInfo === undefined || typeof response.updatedUserInfo === 'object');
};

interface NotificationResponse extends BaseResponse {
    notifications?: Notification[];
}

export const isNotificationResponse = (response: NotificationResponse): response is NotificationResponse => {
    return isBaseResponse(response) && 
        (response.notifications === undefined || Array.isArray(response.notifications));
};

interface KidInfoResponse extends BaseResponse {
    kidInfo?: KidInfo;
}

export const isKidInfoResponse = (response: KidInfoResponse): response is KidInfoResponse => {
    return isBaseResponse(response) && 
        (response.kidInfo === undefined || typeof response.kidInfo === 'object');
};

interface UserDataResponse extends BaseResponse {
    data: UserData;
}

export const isUserDataResponse = (response: UserDataResponse): response is UserDataResponse => {
    return isBaseResponse(response) && 
        (!response.success || isUserData(response.data));
};


