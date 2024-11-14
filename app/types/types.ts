export type{
    WebSocketMessageFromServer,
    ChatMessage,
    LoginState,
} from "./serverDataTypes";

export {
    BaseResponse,
    LoginResponse,
    SearchEventsResponse,
    ChangeEventResponse,
    NotificationResponse,
    KidInfoResponse,
    UserDataResponse,
    isWebSocketMessageFromServer,
    isBaseResponse,
    isLoginResponse,
    isSearchEventsResponse,
    isChangeEventResponse,
    isNotificationResponse,
    isKidInfoResponse,
    isUserDataResponse,
    isGetEventsResponse,
} from "./serverDataTypes";

export type{
    UserInfo,
    Event,
    KidInfo,
    Comment,

} from "./baseType";

export {
    isUserInfo,
    isEvent,
    isKidInfo,
    isComment
} from "./baseType";

export type{
    Notification,
} from "./notification_types";

export {
    isNotification
} from "./notification_types";


export type RecommendEvent={
    event:Event,
    reason:string
};

export type RecommendEvents = RecommendEvent[];

export interface AuthenticationMessage {
    type: 'verifyToken';
    success: boolean;
    userId: number;
    userinfo: UserInfo;
    userEvents: any[];
    kidEvents: any[];
}













