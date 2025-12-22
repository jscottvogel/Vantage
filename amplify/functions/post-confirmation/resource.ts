import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
    name: 'post-confirmation',
    environment: {
        // We'll need table names here potentially, or just access via sdk if possible
    }
});
