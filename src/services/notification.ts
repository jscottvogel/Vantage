import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export const NotificationService = {
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
            console.error('Notification Error:', error);
            return { success: false, error };
        }
    }
};
