import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notification';

// Mock the Amplify Data client generation
const { mockMutate } = vi.hoisted(() => {
    return { mockMutate: vi.fn() };
});

vi.mock('aws-amplify/data', () => ({
    generateClient: () => ({
        mutations: {
            sendHeartbeatNotification: mockMutate
        }
    })
}));

describe('NotificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sendHeartbeatNotification', () => {
        it('should send a notification successfully', async () => {
            mockMutate.mockResolvedValue('Notification Sent');

            const result = await NotificationService.sendHeartbeatNotification(
                'test@example.com',
                'https://app.example.com/item/123',
                'My Objective'
            );

            expect(mockMutate).toHaveBeenCalledWith({
                recipientEmail: 'test@example.com',
                link: 'https://app.example.com/item/123',
                subject: 'Heartbeat Update Required: My Objective',
                messageBody: 'Please update the heartbeat for My Objective.'
            });
            expect(result).toEqual({ success: true, message: 'Notification Sent' });
        });

        it('should handle errors gracefully', async () => {
            mockMutate.mockRejectedValue(new Error('Network Error'));
            // Spy on console.error to keep test output clean
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await NotificationService.sendHeartbeatNotification(
                'test@example.com',
                'link',
                'Item'
            );

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            consoleSpy.mockRestore();
        });
    });
});
