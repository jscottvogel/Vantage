import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
// import type { Schema } from "../../data/resource";

const ses = new SESClient();

type HandlerArgs = {
    recipientEmail: string;
    link: string;
    subject: string;
    messageBody: string;
};

export const handler = async (event: any) => {
    const { recipientEmail, link, subject, messageBody } = event.arguments;

    // TODO: VERIFY THIS EMAIL IN AWS SES CONSOLE
    const SENDER_EMAIL = "j_scott_vogel@yahoo.com";

    const command = new SendEmailCommand({
        Source: SENDER_EMAIL,
        Destination: {
            ToAddresses: [recipientEmail],
        },
        Message: {
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
    });

    try {
        await ses.send(command);
        return { success: true, message: "Email sent successfully" };
    } catch (error) {
        console.error("SES Error:", error);
        // It's often better to return success: false than throw, but for now let's throw to propagate error
        throw new Error("Failed to send email. Ensure the Sender Email is verified in AWS SES.");
    }
};
