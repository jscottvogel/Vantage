import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-ses";
import type { Schema } from "../../data/resource";

const ses = new SESv2Client();

export const handler: Schema["sendHeartbeatNotification"]["functionHandler"] = async (event) => {
    const { recipientEmail, link, subject, messageBody } = event.arguments;

    // TODO: VERIFY THIS EMAIL IN AWS SES CONSOLE
    const SENDER_EMAIL = "noreply@vantagestrategy.io";

    const command = new SendEmailCommand({
        FromEmailAddress: SENDER_EMAIL,
        Destination: {
            ToAddresses: [recipientEmail],
        },
        Content: {
            Simple: {
                Subject: {
                    Data: subject,
                    Charset: "UTF-8",
                },
                Body: {
                    Text: {
                        Data: `${messageBody}\n\nLink: ${link}`,
                        Charset: "UTF-8",
                    },
                    Html: {
                        Data: `<p>${messageBody}</p><p><a href="${link}">Click here to update</a></p>`,
                        Charset: "UTF-8",
                    }
                },
            },
        },
    });

    try {
        await ses.send(command);
        return "Email sent successfully";
    } catch (error) {
        console.error("SES Error:", error);
        throw new Error("Failed to send email. Ensure the Sender Email is verified in AWS SES.");
    }
};
