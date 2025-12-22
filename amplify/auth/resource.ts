import { defineAuth } from '@aws-amplify/backend';
import { preSignUp } from '../functions/pre-signup/resource';

export const auth = defineAuth({
    loginWith: {
        email: true,
    },
    triggers: {
        preSignUp,
    },
    triggers: {
        preSignUp,
    },
});
