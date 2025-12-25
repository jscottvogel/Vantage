import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);
}

export const handler: PostConfirmationTriggerHandler = async (event) => {
    try {
        const { userAttributes } = event.request;
        const { email, name, sub } = userAttributes;

        // Attributes passed from Client during Step 1 of Sign Up
        const tenantId = userAttributes['locale'];
        const orgName = userAttributes['nickname'];
        // We assume the first user is the Owner

        const now = new Date().toISOString();

        // 1. Create UserProfile (Always)
        const userProfileParams = {
            TableName: process.env.USER_PROFILE_TABLE,
            Item: marshall({
                userSub: sub,
                email: email,
                displayName: name,
                createdAt: now,
                updatedAt: now,
                owner: `${sub}::${sub}` // for allow.owner()
            })
        };

        try {
            await client.send(new PutItemCommand(userProfileParams));
            console.log(`Created UserProfile: ${email}`);
        } catch (err) {
            console.error("Failed to create UserProfile:", err);
            // Non-fatal if exists?
        }

        // 2. Create Organization & Membership (If this was an Org Sign Up)
        /* 
        // DISABLED FOR FRONTEND BOOTSTRAP CONTROL
        if (tenantId && orgName) {
            const orgSlug = generateSlug(orgName);

            const orgParams = {
                TableName: process.env.ORG_TABLE,
                Item: marshall({
                    id: tenantId, // orgId
                    name: orgName,
                    slug: orgSlug,
                    subscriptionTier: 'Free',
                    status: 'Active',
                    createdBySub: sub,
                    createdAt: now,
                    updatedAt: now,
                })
            };

            const membershipParams = {
                TableName: process.env.MEMBERSHIP_TABLE,
                Item: marshall({
                    id: `${tenantId}#${sub}`, // Composite ID for simple GET
                    orgId: tenantId,
                    userSub: sub,
                    role: 'Owner',
                    status: 'Active',
                    createdAt: now,
                    updatedAt: now,
                    owner: `${sub}::${sub}` // I own my membership
                })
            };

            await client.send(new PutItemCommand(orgParams));
            console.log(`Created Organization: ${orgName}`);

            await client.send(new PutItemCommand(membershipParams));
            console.log(`Created Membership for Owner`);
        }
        */

    } catch (error) {
        console.error("Error in post-confirmation:", error);
    }

    return event;
};
