import Helper from "../helper/Helper";
export default class Instance extends Helper {
    private WLredis;
    private session;
    private session_id;
    private target;
    constructor(req: any, res: any);
    me(req: any, res: any): Promise<void>;
    updateProfilePicture(req: any, res: any): Promise<void>;
    updatePresence(req: any, res: any): Promise<void>;
    updateProfileName(req: any, res: any): Promise<void>;
    updateProfileStatus(req: any, res: any): Promise<void>;
    fetchContacts(req: any, res: any): Promise<void>;
    getContactByID(req: any, res: any): Promise<void>;
}
