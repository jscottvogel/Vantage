import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendNotification } from './functions/send-notification/resource';
import { manageOrg } from './functions/manage-org/resource';
import { preSignUp } from './functions/pre-signup/resource';
import { postConfirmation } from './functions/post-confirmation/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function } from 'aws-cdk-lib/aws-lambda';

const backend = defineBackend({
    auth,
    data,
    sendNotification,
    manageOrg,
    preSignUp,
    postConfirmation,
});

const postConfirmationLambda = backend.postConfirmation.resources.lambda as Function;
const manageOrgLambda = backend.manageOrg.resources.lambda as Function;

// Tables
const orgTable = backend.data.resources.tables.Organization;
const userProfileTable = backend.data.resources.tables.UserProfile;
const membershipTable = backend.data.resources.tables.Membership;
const inviteTable = backend.data.resources.tables.Invite;

// Post Confirmation Permissions
postConfirmationLambda.addEnvironment('ORG_TABLE', orgTable.tableName);
postConfirmationLambda.addEnvironment('USER_PROFILE_TABLE', userProfileTable.tableName);
postConfirmationLambda.addEnvironment('MEMBERSHIP_TABLE', membershipTable.tableName);

orgTable.grantWriteData(postConfirmationLambda);
userProfileTable.grantWriteData(postConfirmationLambda);
membershipTable.grantWriteData(postConfirmationLambda);

// Manage Org Permissions
manageOrgLambda.addEnvironment('ORG_TABLE', orgTable.tableName);
manageOrgLambda.addEnvironment('MEMBERSHIP_TABLE', membershipTable.tableName);
manageOrgLambda.addEnvironment('INVITE_TABLE', inviteTable.tableName);

orgTable.grantReadData(manageOrgLambda);
membershipTable.grantReadWriteData(manageOrgLambda); // Needs read for auth check
inviteTable.grantReadWriteData(manageOrgLambda);

// Existing Notification Logic
const sendNotificationLambda = backend.sendNotification.resources.lambda;
sendNotificationLambda.addToRolePolicy(
    new PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
    })
);
