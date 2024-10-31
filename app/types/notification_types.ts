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

// Define NotificationType union type
type NotificationType = 
    | 'signUpRequest'
    | 'signUpApproval'
    | 'signUpRejection'
    | 'signUpConfirmation'
    | 'cancellationConfirmation'
    | 'unfollowNotification'
    | 'activityCreated';

// Export the final Notification type as a union of all specific notification types
export type Notification = 
    | SignUpRequestNotification 
    | EventRelatedNotification 
    | UnfollowNotification 
    | ActivityCreatedNotification;