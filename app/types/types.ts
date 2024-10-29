import {Notification} from "./notification_types"

export type Comment = {
    id: number;
    content: string;
    userId: number;
};


export type Event = {
    id: number;
    place: {
        location: [number, number];
        maxNumber: number;
    };
    dateTime: string;
    duration: number;
    topic: string;
    description: string;
    kidIds: number[];
    userId: number;
    pendingSignUps?: Array<{id:number,type:"event"|"kid",kidIds:number[], sourceEventId: number; reason: string }>;
    status:'preparing'|'started'|'ended'|'merged';
    comments?:Comment[];
};

export type RecommendEvent={
    event:Event,
    reason:string
};

export type RecommendEvents = RecommendEvent[];

export type MatchEvent ={
    event:Event,
    score:number
};

export type MatchEvents = {
    [sourceEventId:number]:MatchEvent[]
};

export type KidInfo ={
    id: number;
    name: string;
    gender: 'male' | 'female';
    photoPath: string;
    description: string;
    personalSpaceUrl: string;
    birthDate: string;
    guardians: Array<{
        userId: number;
        relationship: string;
    }>;
}

export type UserInfo = {
    email: string;
    username: string;
    id: number;
    introduction?: string;
    kidinfo: KidInfo[];
    following: number[];
    followers: number[];
};

export type Events = Event[];

export interface AuthenticationMessage {
    type: 'verifyToken';
    success: boolean;
    userId: number;
    userinfo: UserInfo;
    userEvents: any[];
    kidEvents: any[];
}

export type MessageFromServer =
    | { type: 'notification'; notification: Notification } 
    | { type: 'appDataSyncToClient'; success: boolean; data: AppDataSyncPayload } 
    | { type: string; [key: string]: any };

export type AppDataSyncPayload = {
    notifications: Notification[];
    userInfo: UserInfo;
    userEvents: Event[];
    kidEvents: Event[];
};

