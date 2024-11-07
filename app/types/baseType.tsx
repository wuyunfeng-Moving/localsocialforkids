import {Notification} from "./notification_types"


export type Comment = {
    id: number;
    content: string;
    userId: number;
};

export const isComment = (comment: any): comment is Comment => {
    return typeof comment.id === 'number' &&
        typeof comment.content === 'string' &&
        typeof comment.userId === 'number' &&
        (comment.createdAt === undefined || typeof comment.createdAt === 'string');
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
    chatIds?:number[];
};

export const isEvent = (event: any): event is Event => {
    return typeof event.id === 'number' &&
        typeof event.place === 'object' &&
        typeof event.dateTime === 'string' &&
        typeof event.duration === 'number' &&
        typeof event.topic === 'string' &&
        typeof event.description === 'string' &&
        Array.isArray(event.kidIds) &&
        event.kidIds.every((kidId: any) => typeof kidId === 'number') &&
        typeof event.userId === 'number' &&
        (event.pendingSignUps === undefined || Array.isArray(event.pendingSignUps)) &&
        event.pendingSignUps?.every((signUp: any) => typeof signUp.id === 'number' && typeof signUp.type === 'string' && Array.isArray(signUp.kidIds) && signUp.kidIds.every((kidId: any) => typeof kidId === 'number') && typeof signUp.sourceEventId === 'number' && typeof signUp.reason === 'string') &&
        (event.status === 'preparing' || event.status === 'started' || event.status === 'ended' || event.status === 'merged') &&
        (event.comments === undefined || Array.isArray(event.comments)) &&
        event.comments?.every((comment: any) => typeof comment.id === 'number' && typeof comment.content === 'string' && typeof comment.userId === 'number') &&
        (event.chatIds === undefined || Array.isArray(event.chatIds)) &&
        event.chatIds?.every((chatId: any) => typeof chatId === 'number');
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

export const isKidInfo = (kidInfo: any): kidInfo is KidInfo => {
    return typeof kidInfo.id === 'number' &&
        typeof kidInfo.name === 'string' &&
        (kidInfo.gender === 'male' || kidInfo.gender === 'female') &&
        typeof kidInfo.photoPath === 'string' &&
        typeof kidInfo.description === 'string' &&
        typeof kidInfo.personalSpaceUrl === 'string' &&
        typeof kidInfo.birthDate === 'string' &&
        Array.isArray(kidInfo.guardians) &&
        kidInfo.guardians.every((guardian: any) => typeof guardian.userId === 'number' && typeof guardian.relationship === 'string');
};

export type UserInfo = {
    email: string;
    username: string;
    id: number;
    introduction?: string;
    avatar?: string;
    kidinfo: KidInfo[];
    following: number[];
    followers: number[];
};

export const isUserInfo = (userInfo: any): userInfo is UserInfo => {
    return typeof userInfo.email === 'string' &&
        typeof userInfo.username === 'string' &&
        typeof userInfo.id === 'number' &&
        Array.isArray(userInfo.kidinfo) &&
        userInfo.kidinfo.every((kid: any) => isKidInfo(kid)) &&
        Array.isArray(userInfo.following) &&
        userInfo.following.every((following: any) => typeof following === 'number') &&
        Array.isArray(userInfo.followers) &&
        userInfo.followers.every((follower: any) => typeof follower === 'number') &&
        (userInfo.introduction === undefined || typeof userInfo.introduction === 'string') &&
        (userInfo.avatar === undefined || typeof userInfo.avatar === 'string');
};

export type Events = Event[];

