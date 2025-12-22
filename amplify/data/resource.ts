import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendNotification } from '../functions/send-notification/resource';

const schema = a.schema({
    NotificationResponse: a.customType({
        success: a.boolean().required(),
        message: a.string(),
    }),
    testMutation: a.mutation()
        .arguments({})
        .returns(a.string())
        .authorization(allow => [allow.authenticated()])
        .handler(a.handler.function(sendNotification)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});
