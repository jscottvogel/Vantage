import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

/**
 * Service for sending system notifications.
 * Currently supports Heartbeat notifications via AWS Amplify Data mutations.
 */
export const NotificationService = {
    /**
     * Triggers a heartbeat notification email to a recipient.
     * @param recipientEmail The email address of the recipient.
     * @param link The deep link URL to the item needing attention.
     * @param itemName The name of the Objective, Key Result, or Initiative.
     * @returns Promise<{ success: boolean; message?: unknown; error?: unknown }>
     */
    async sendHeartbeatNotification(recipientEmail: string, link: string, itemName: string) {
        try {
            const response = await client.mutations.sendHeartbeatNotification({
                recipientEmail,
                link,
                subject: `Heartbeat Update Required: ${itemName}`,
                messageBody: `Please update the heartbeat for ${itemName}.`
            });
            return { success: true, message: response };
        } catch (error) {
            console.error('Notification Service Error:', error);
            // In a real app, we might want to log this to a monitoring service (e.g. CloudWatch, Sentry)
            return { success: false, error };
        }
    }
};
