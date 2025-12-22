import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

export const handler: PostConfirmationTriggerHandler = async (event) => {
    try {
        const { userAttributes } = event.request;
        const { email, name, sub } = userAttributes;

        // Custom attributes
        const tenantId = userAttributes['locale']; // We stored tenantId in locale
        const orgName = userAttributes['nickname']; // We stored orgName in nickname
        const role = userAttributes['profile'] || 'Admin';

        if (!tenantId || !orgName) {
            console.log("No tenantId or orgName found, skipping organization creation (likely inviting user flow or login)");
            // If it's an invited user, we might still want to create the User record if not exists? 
            // But they should already have a tenantId.
            // If it is just a normal signup without these, we might skip.
            // But for this "Organization First" flow, these are required for the Admin.
            return event;
        }

        const now = new Date().toISOString();

        // 1. Create Organization
        // We use the tenantId as the Organization ID
        const orgParams = {
            TableName: process.env.ORG_TABLE,
            Item: marshall({
                id: tenantId,
                name: orgName,
                subscriptionTier: 'Free',
                createdAt: now,
                updatedAt: now,
            })
        };

        try {
            await client.send(new PutItemCommand(orgParams));
            console.log(`Created Organization: ${orgName} (${tenantId})`);
        } catch (err) {
            console.error("Failed to create Organization:", err);
            // We might want to fail the sign up if this fails? 
            // But post-confirmation can't really block sign up success ultimately, just side effects.
        }

        // 2. Create User
        // The ID of the user record should match the Cognito Sub for easier lookup, or we can just let it be random and store the sub. 
        // But the schema defined 'User' with 'email' as required, 'id' is auto.
        // Let's use the Cognito 'sub' as the User 'id' to keep them linked 1:1 easily.

        const userParams = {
            TableName: process.env.USER_TABLE,
            Item: marshall({
                id: sub, // Use Cognito Sub as ID
                email: email,
                name: name,
                role: role,
                tenantId: tenantId,
                status: 'Active',
                createdAt: now,
                updatedAt: now,
                owner: `${sub}::${sub}` // Generic owner field if needed for auth rules. 
                // Amplify Gen 2 'owner' auth usually checks the 'owner' field. 
                // By default it stores "sub::username" or similar. 
                // For now let's hope the default 'allow.owner()' works if we just create the record. 
                // Actually, if we create it via Lambda, we should set the owner field manually if we want the user to be able to read it immediately.
                // The format is usually `<sub or username>`.
            })
        };

        try {
            await client.send(new PutItemCommand(userParams));
            console.log(`Created User: ${email}`);
        } catch (err) {
            console.error("Failed to create User:", err);
        }

    } catch (error) {
        console.error("Error in post-confirmation:", error);
    }

    return event;
};
