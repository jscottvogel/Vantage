import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendNotification } from '../functions/send-notification/resource';

const schema = a.schema({
    NotificationResponse: a.customType({
        success: a.boolean().required(),
        message: a.string(),
    }),
    User: a.model({
        email: a.string().required(),
        name: a.string(),
        role: a.string(),
        tenantId: a.string(),
        status: a.string(),
    })
        .authorization(allow => [allow.owner(), allow.authenticated()]), // Allow authenticated for now to simplify team visibility
    sendHeartbeatNotification: a
        .mutation()
        .arguments({
            recipientEmail: a.string().required(),
            link: a.string().required(),
            subject: a.string().required(),
            messageBody: a.string().required()
        })
        .returns(a.ref('NotificationResponse'))
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
