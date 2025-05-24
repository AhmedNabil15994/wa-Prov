import Helper from "../helper/Helper";
export default class Message extends Helper {
    private WLredis;
    private session;
    private session_id;
    private target;
    constructor(req: any, res: any);
    fetchMessages(req: any, res: any): Promise<void>;
    findMessage(req: any, res: any): Promise<void>;
    sendOFFMessage(req: any, res: any): Promise<void>;
    send(req: any, res: any, type: any): Promise<void>;
    /*********************************************************/
    sendReply(req: any, res: any): Promise<void>;
    forwardMessage(req: any, res: any): Promise<void>;
    sendOneFromGroup(phone: any, input: any, res: any, loop: any, checked: any): Promise<void>;
    sendGroupMessage(req: any, res: any): Promise<void>;
    /*********************************************************/
    deleteMessage(req: any, res: any): Promise<void>;
    deleteMessageForMe(req: any, res: any): Promise<void>;
    starMessage(req: any, res: any): Promise<void>;
    unstarMessage(req: any, res: any): Promise<void>;
}
