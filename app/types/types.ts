import {Notification,isNotification} from "./notification_types"
import {WebSocketMessageFromServer,isWebSocketMessageFromServer} from "./serverDataTypes"
import {UserInfo,isUserInfo,Event,isEvent,KidInfo,isKidInfo} from "./baseType"
import {} from "./serverDataTypes"


export interface MessageFromServer extends WebSocketMessageFromServer{}
export const isMessageFromServer = (message: WebSocketMessageFromServer): message is MessageFromServer => {
    return isWebSocketMessageFromServer(message);
};

export 

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
















