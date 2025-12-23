import { defineAuth } from '@aws-amplify/backend';
import { preSignUp } from '../functions/pre-signup/resource';
import { postConfirmation } from '../functions/post-confirmation/resource';

export const auth = defineAuth({
    loginWith: {
        email: true,
    },
    /* triggers: {
        preSignUp,
        // postConfirmation,
    }, */
});
