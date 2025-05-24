export default class PollUpdateDecrypt {
    constructor();
    getCrypto(): Crypto;
    comparePollMessage(options: string[], pollOptionHashes: string[]): Promise<string[]>;
    decryptPollMessageInternal(encPayload: Uint8Array, encIv: Uint8Array, additionalData: Uint8Array, decryptionKey: Uint8Array): Promise<Uint8Array>;
    decodePollMessage(decryptedMessage: Uint8Array): string;
    decryptPollMessageRaw(encKey: Uint8Array, encPayload: Uint8Array, encIv: Uint8Array, pollMsgSender: string, pollMsgId: string, voteMsgSender: string): Promise<string[]>;
}
