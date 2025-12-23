import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
// import { sendNotification } from './functions/send-notification/resource';
import { preSignUp } from './functions/pre-signup/resource';
import { postConfirmation } from './functions/post-confirmation/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function } from 'aws-cdk-lib/aws-lambda';

const backend = defineBackend({
    auth,
    data,
    // sendNotification,
    preSignUp,
    postConfirmation,
});

const postConfirmationLambda = backend.postConfirmation.resources.lambda as Function;
// Grant access to tables
const orgTable = backend.data.resources.tables.Organization;
const userTable = backend.data.resources.tables.User;

postConfirmationLambda.addEnvironment('ORG_TABLE', orgTable.tableName);
postConfirmationLambda.addEnvironment('USER_TABLE', userTable.tableName);

orgTable.grantWriteData(postConfirmationLambda);
userTable.grantWriteData(postConfirmationLambda);

// const sendNotificationLambda = backend.sendNotification.resources.lambda;
// 
// sendNotificationLambda.addToRolePolicy(
//     new PolicyStatement({
//         actions: ['ses:SendEmail', 'ses:SendRawEmail'],
//         resources: ['*'],
//     })
// );
