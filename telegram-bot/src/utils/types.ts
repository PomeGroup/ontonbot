export type TVisitor = {
    telegram_id: string;
    first_name: string;
    last_name: string;
    username: string;
    created_at: string;
}

export type ParsedInitData = {
    query_id: string;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        username: string;
        language_code: string;
        is_premium: boolean;
        allows_write_to_pm: boolean;
    };
    auth_date: string;
    hash: string;
};