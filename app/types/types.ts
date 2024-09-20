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
    participants?: number[];
    userId: number;
    pendingSignUps?: Array<{ sourceEventId: number; reason: string }>;
};

export type MatchEvent ={
    event:Event,
    score:number
};

export type MatchEvents = {
    [sourceEventId:number]:MatchEvent[]
};

export type UserInfo = {
    email: string;
    username: string;
    id: number;
    kidinfo: Array<{
        id: number;
        name: string;
        gender: 'male' | 'female';
        photoPath: string;
        description: string;
        personalSpaceUrl: string;
        guardians: Array<{
            userId: number;
            relationship: string;
        }>;
    }>;
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
    | { type: 'notification'; notification: { type: string; message: string } }
    | { type: string; [key: string]: any };
