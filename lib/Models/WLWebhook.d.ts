import Helper from '../helper/Helper';
export default class WLWebhook extends Helper {
    private needle;
    private base_url;
    private Redis;
    constructor();
    appLogOut(sessionId: any): Promise<void>;
    connectionConnected(sessionId: any): Promise<void>;
    MessageUpsert(sessionId: any, message: any): Promise<void>;
}
