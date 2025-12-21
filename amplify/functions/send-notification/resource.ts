import { defineFunction } from '@aws-amplify/backend';

export const sendNotification = defineFunction({
    name: 'send-notification',
    entry: './handler.ts'
});
