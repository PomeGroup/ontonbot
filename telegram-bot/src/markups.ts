import { Markup } from "telegraf"

const startKeyboard = () => {
    const data = [
        [
            {
                text: "Discover Events",
                web_app: {
                    url: `${process.env.APP_BASE_URL}/`,
                    display_name: "Open",
                },
            },

        ],
    ];

    return data
}



const shareKeyboard = (url: string) => {
    const id = url.split('/').pop().replace('event?startapp=', "") || '';


    const data = [
        [
            Markup.button.switchToChat('Share Link', url)

        ],
        [
            {
                text: "Manage Event",
                web_app: {
                    url: `${process.env.APP_BASE_URL}/events/${id}/edit`,
                    display_name: "Open",
                },
            },
        ],
        [
            {
                text: "All Events",
                web_app: {
                    url: `${process.env.APP_BASE_URL}/`,
                    display_name: "Open",
                },
            },
        ]
    ];

    return data
}


const backKeyboard = [[{ text: "Back", callback_data: "back" }]];
const inlineSendKeyboard = () => {
    return [[{ text: "Refresh", callback_data: "refresh" }]];
};

export { backKeyboard, inlineSendKeyboard, shareKeyboard, startKeyboard }

