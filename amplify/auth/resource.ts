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
        "custom:role": {
            dataType: "String",
            mutable: true,
        },
        "custom:tenant_id": {
            dataType: "String",
            mutable: true,
        },
        "custom:org_name": {
            dataType: "String",
            mutable: true,
        },
    },
});
