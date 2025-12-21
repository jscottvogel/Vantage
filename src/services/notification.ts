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
        } catch (error: any) {
            // Implicit Dev Fallback
            if (error.name === 'NotConfiguredException' || error.message?.includes('not been configured') || error.message?.includes('User pool client') || !client) {
                console.log(`[Dev Notification] To: ${recipientEmail}, Item: ${itemName}`);
                return { success: true, message: "Dev email sent (Simulated)" };
            }
            console.error('Notification Error:', error);
            return { success: false, error };
        }
    }
};
