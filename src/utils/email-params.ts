import env from "./env";

const emailParams = (email: string, token: string, subject: string, heading: string, pathname: string) => {
    const url = env.CLIENT_URL + `/${pathname}/` + token;
    const html = `
        <div>
            <h2>
                ${heading}
            </h2>
            </hr>
            <a href="${url}">${url}</a>
        </div>
    `;
    return {
        Destination: {
            CcAddresses: [],
            ToAddresses: [email],
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: html,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: subject,
            },
        },
        Source: env.SENDER_EMAIL!,
        ReplyToAddresses: [env.SENDER_EMAIL!],
    };
}

export default emailParams;