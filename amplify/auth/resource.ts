import { defineAuth } from '@aws-amplify/backend';
import { preSignUp } from '../functions/pre-signup/resource';

export const auth = defineAuth({
    loginWith: {
        email: true,
    },
    triggers: {
        preSignUp,
    },
    userAttributes: {
        "role": {
            dataType: "String",
            mutable: true,
        },
        "tenant_id": {
            dataType: "String",
            mutable: true,
        },
        "org_name": {
            dataType: "String",
            mutable: true,
        },
    },
});
