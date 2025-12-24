import { defineFunction } from '@aws-amplify/backend';

export const manageOrg = defineFunction({
    name: 'manage-org',
    entry: './handler.ts'
});
