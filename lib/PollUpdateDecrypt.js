"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PollUpdateDecrypt {
    constructor() { }
    getCrypto() {
        const c = require('crypto');
        return 'subtle' in ((c === null || c === void 0 ? void 0 : c.webcrypto) || {}) ? c.webcrypto : new (require('@peculiar/webcrypto').Crypto)();
    }
    async comparePollMessage(options, pollOptionHashes) {
        const selectedOptions = [];
        const crypto = this.getCrypto();
        for (const option of options) {
            const hash = Buffer
                .from(await crypto.subtle.digest('SHA-256', (new TextEncoder).encode(option)))
                .toString('hex').toUpperCase();
            if (pollOptionHashes.findIndex(h => h === hash) > -1) {
                selectedOptions.push(option);
            }
        }
        ;
        return selectedOptions;
    }
    async decryptPollMessageInternal(encPayload, encIv, additionalData, decryptionKey) {
        const crypto = this.getCrypto();
        const tagSize_multiplier = 16;
        const encoded = encPayload;
        const key = await crypto.subtle.importKey('raw', decryptionKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: encIv, additionalData: additionalData, tagLength: 8 * tagSize_multiplier }, key, encoded);
        return new Uint8Array(decrypted).slice(2); // remove 2 bytes (OA20)(space+newline)
    }
    decodePollMessage(decryptedMessage) {
        const n = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70];
        const outarr = [];
        for (let i = 0; i < decryptedMessage.length; i++) {
            const val = decryptedMessage[i];
            outarr.push(n[val >> 4], n[15 & val]);
        }
        return String.fromCharCode(...outarr);
    }
    async decryptPollMessageRaw(encKey, encPayload, encIv, pollMsgSender, pollMsgId, voteMsgSender) {
        const enc = new TextEncoder();
        const crypto = this.getCrypto();
        const stanzaId = enc.encode(pollMsgId);
        const parentMsgOriginalSender = enc.encode(pollMsgSender);
        const modificationSender = enc.encode(voteMsgSender);
        const modificationType = enc.encode('Poll Vote');
        const pad = new Uint8Array([1]);
        const signMe = new Uint8Array([...stanzaId, ...parentMsgOriginalSender, ...modificationSender, ...modificationType, pad]);
        const createSignKey = async (n = new Uint8Array(32)) => {
            return (await crypto.subtle.importKey('raw', n, { 'name': 'HMAC', 'hash': 'SHA-256' }, false, ['sign']));
        };
        const sign = async (n, key) => {
            return (await crypto.subtle.sign({ 'name': 'HMAC', 'hash': 'SHA-256' }, key, n));
        };
        let key = await createSignKey();
        const temp = await sign(encKey, key);
        key = await createSignKey(new Uint8Array(temp));
        const decryptionKey = new Uint8Array(await sign(signMe, key));
        const additionalData = enc.encode(`${pollMsgId}\u0000${voteMsgSender}`);
        const decryptedMessage = await this.decryptPollMessageInternal(encPayload, encIv, additionalData, decryptionKey);
        const pollOptionHash = this.decodePollMessage(decryptedMessage);
        // '0A20' in hex represents unicode " " and "\n" thus declaring the end of one option
        // we want multiple hashes to make it easier to iterate and understand for your use cases
        return pollOptionHash.split('0A20') || [];
    }
}
exports.default = PollUpdateDecrypt;
