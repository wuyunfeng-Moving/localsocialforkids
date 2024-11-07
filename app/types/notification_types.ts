// Base notification interface with common properties
interface BaseNotification {
    id: number;
    type: NotificationType;
    message: string;
    createdAt: string;
    read: boolean;
}

// Specific notification types
interface SignUpRequestNotification extends BaseNotification {
    type: 'signUpRequest';
    eventId: number;
    userId: string;
    sourceEventId?: number;
    kidIds?: number[];
}

interface EventRelatedNotification extends BaseNotification {
    type: 'signUpApproval' | 'signUpRejection' | 'signUpConfirmation' | 'cancellationConfirmation';
    eventId: number;
}

interface UnfollowNotification extends BaseNotification {
    type: 'unfollowNotification';
    unfollowerId: string;
}

interface ActivityCreatedNotification extends BaseNotification {
    type: 'activityCreated';
    activityId: number;
    creatorId: number;
}

interface ChatMessageNotification extends BaseNotification {
    type: 'chatMessage';
    chatId: number;
    senderId: number;
    eventId: number;
}

// Define NotificationType union type
type NotificationType = 
    | 'signUpRequest'
    | 'signUpApproval'
    | 'signUpRejection'
    | 'signUpConfirmation'
    | 'cancellationConfirmation'
    | 'unfollowNotification'
    | 'activityCreated'
    | 'chatMessage';

// Export the final Notification type as a union of all specific notification types
export type Notification = 
    | SignUpRequestNotification 
    | EventRelatedNotification 
    | UnfollowNotification 
    | ActivityCreatedNotification
    | ChatMessageNotification;


export const isNotification = (notification: any): notification is Notification => {
    return typeof notification.id === 'number' &&
        typeof notification.userId === 'number' &&
        typeof notification.message === 'string' &&
        typeof notification.createdAt === 'string' &&
        typeof notification.read === 'boolean';
};
