export type Notification = 
|{
    // Add properties for Notification type here
    type: 'signUpRequest';
    message: string;
    userId:number;
    targetEventId:number;
    sourceEventId:number;
    createdAt:string;
    read:boolean;
    id:number;
    // Add any other relevant properties
}
|{
    type:string;
    message:string;
    createdAt:string;
    read:boolean;
    id:number;
};