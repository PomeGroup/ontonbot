import { Markup } from "telegraf";
import { button } from "telegraf/typings/markup";

const BASE_URL = process.env.BASE_URL || 'https://app.tonsites.io'

const startKeyboard = () => {
    const data = [
        [
            {
                text: "Discover Events",
                web_app: {
                    url: "https://onton.challenquiz.online/events",
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
                    url: `https://onton.challenquiz.online/events/${id}/edit`,
                    display_name: "Open",
                },
            },
        ],
        [
            {
                text: "All Events",
                web_app: {
                    url: "https://onton.challenquiz.online/events",
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

export { startKeyboard, backKeyboard, inlineSendKeyboard, shareKeyboard };
