import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendNotification } from './functions/send-notification/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
    auth,
    data,
    sendNotification,
});

const sendNotificationLambda = backend.sendNotification.resources.lambda;

sendNotificationLambda.addToRolePolicy(
    new PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
    })
);
