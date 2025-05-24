import Helper from '../helper/Helper';
export default class WLRedis extends Helper {
    private redis;
    constructor();
    getInstanceName(dbInstance: any, single?: number): any;
    setOne(session_id: any, data: any, dbInstance: any): Promise<any>;
    getOne(session_id: any, id: any, dbInstance: any): Promise<any>;
    updateOne(session_id: any, instanceData: any, dbInstance: any): Promise<any>;
    deleteOne(session_id: any, id: any, dbInstance: any): Promise<any>;
    setData(session_id: any, data: any, dbInstance: any, sock?: any): Promise<true | null | undefined>;
    getData(session_id: any, dbInstance: any): Promise<any[] | undefined>;
    deleteData(session_id: any, dbInstance: any): Promise<any>;
    private getKeys;
    getLastMessageInChat(session_id: any, chatId: any, type?: number): Promise<any>;
    getLastMessagesInChat(session_id: any, chatId: any): Promise<any[] | undefined>;
    deleteSession(session_id: any): Promise<void>;
    empty(session_id: any, instance: any): Promise<void>;
}
