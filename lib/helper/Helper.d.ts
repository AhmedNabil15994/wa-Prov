export default class Helper {
    response(res: any, statusCode?: number, success?: boolean, message?: string, data?: {}): void;
    isSessionExists(sessionId: any): 1 | 0;
    sessionsDir(sessionId?: string): string;
    formatPhone: (phone: any) => any;
    isString(value: any): boolean;
    sleep(ms: any): Promise<unknown>;
    sleeps(delay: any): Promise<void>;
    delays(ms: any): Promise<void>;
    fixRemoteJid(remoteJid: any): any;
    formatGroup: (group: any) => any;
    onWhatsApp(session: any, id: any): Promise<any>;
    isExists(session: any, jid: any, isGroup?: boolean): boolean;
    isBusiness(session: any, id: any): Promise<boolean>;
    mimeType(url: any): any;
    fileName(url: any): string | undefined;
    reformatPhone(phone: any, checkGroup?: null): any;
    formatStatusText(status: any): string;
    formatButtons: (buttons: any) => any;
    reformatOptions: (options: any) => any;
    formatButtonsResponse(buttons: any): any;
    formatOptionsResponse(options: any): any;
    formatTemplateButtonsResponse(buttons: any): any;
    formatSectionsResponse(sections: any): any;
    formatTemplateButtons(buttons: any): any;
    getMessageStatus(msgObj: any): number;
    getMessageTime(msgObj: any): any;
    getMessageInfo(msgObj: any, messageType: any, time: any, newSessionId: any, sock: any): Promise<{
        body: string;
        fileName: any;
        messageType: "gif" | "audio" | "document" | "image" | "ppic" | "product" | "ptt" | "sticker" | "video" | "thumbnail-document" | "thumbnail-image" | "thumbnail-video" | "thumbnail-link" | "md-msg-hist" | "md-app-state" | "product-catalog-image" | "payment-bg-image" | "ptv";
        caption: any;
        metadata: {};
    } | {
        body: string;
        metadata: {};
        fromMe: any;
        messageType: any;
    }>;
    getMediaMessageInfo(msg: any, messageType: any, time: any, newSessionId: any, sock: any): Promise<{
        body: string;
        fileName: any;
        messageType: "gif" | "audio" | "document" | "image" | "ppic" | "product" | "ptt" | "sticker" | "video" | "thumbnail-document" | "thumbnail-image" | "thumbnail-video" | "thumbnail-link" | "md-msg-hist" | "md-app-state" | "product-catalog-image" | "payment-bg-image" | "ptv";
        caption: any;
        metadata: {};
    }>;
    downloadMessageFile(msg: any, path: any, sock: any): Promise<void>;
    getMessageTypeText(msgObj: any, messageType: any): any;
    getMessageTypeDetails(msgObj: any, messageType: any, time: any, newSessionId: any, sock: any): Promise<{
        body: string;
        metadata: {};
        fromMe: any;
    }>;
    restoreMessageFormat(msg: any): Promise<{
        message: {};
        messageTimestamp: number;
        key: {
            remoteJid: any;
            fromMe: any;
            id: any;
            participant: undefined;
        };
    }>;
    getReactionText(reaction: any): any;
    formatMsgToBeSendAsReply(input: any, selected: any): Promise<{}>;
    formatMsgToOldState(msg: any): Promise<{
        message: {};
        messageTimestamp: number;
    }>;
    reformatMessageObj(sessionId: any, msg: any, messageType: any, sock: any, options?: {}): Promise<{
        body: string;
        fileName: any;
        messageType: "gif" | "audio" | "document" | "image" | "ppic" | "product" | "ptt" | "sticker" | "video" | "thumbnail-document" | "thumbnail-image" | "thumbnail-video" | "thumbnail-link" | "md-msg-hist" | "md-app-state" | "product-catalog-image" | "payment-bg-image" | "ptv";
        caption: any;
        metadata: {};
        id: any;
        fromMe: any;
        author: any;
        chatName: any;
        pushName: any;
        time: any;
        timeFormatted: string;
        status: number;
        statusText: string;
        deviceSentFrom: "android" | "unknown" | "web" | "ios" | "desktop";
        remoteJid: any;
    } | {
        body: string;
        metadata: {};
        fromMe: any;
        messageType: any;
        id: any;
        author: any;
        chatName: any;
        pushName: any;
        time: any;
        timeFormatted: string;
        status: number;
        statusText: string;
        deviceSentFrom: "android" | "unknown" | "web" | "ios" | "desktop";
        remoteJid: any;
    }>;
    getMessageKeyData(receiver: any, sessionId: any): Promise<{
        key: {
            remoteJid: any;
            fromMe: boolean;
        };
        messageTimestamp: number;
        status: string;
        sessionId: any;
    }>;
    formatWAMsgToBeSend(input: any, type: any): Promise<{
        message: {};
    }>;
    paginateData(data: any, page: any, size: any): Promise<{
        data: any;
        pagination: {
            currentPage: number;
            nextPage: number;
            lastPage: number;
            pageLimit: number;
            totalCount: number;
        };
    }>;
}
