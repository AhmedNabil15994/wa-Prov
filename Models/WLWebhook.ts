import needle from 'needle';
import * as dotenv from 'dotenv';
import Helper from '../helper/Helper';
import WLRedis from './WLRedis';
import rq from 'request'

export default class WLWebhook extends Helper {
    private needle;
    private base_url;
    private Redis;
    constructor() {
        super();
        dotenv.config();
        this.needle = needle;
        this.base_url = process.env.WEBHOOK_URL;
        this.Redis = new WLRedis();
    }

    async appLogOut(sessionId) {
        try {
            var requestOptions = {
                headers: {
                    SESSION: sessionId,
                },
            };
            await needle('GET',process.env.BACKEND_URL+"/instances/status?status=disconnected",requestOptions)
                .then(function (response) {})
                .catch(function (err) {
                    console.log('WLWebhook connectionConnected error: ' +err)
                });
        } catch (error) {
            console.log('WLWebhook Logout : ' + error)
        }
    }

    async connectionConnected(sessionId) {
        try {
            var requestOptions = {
                headers: {
                    SESSION: sessionId,
                },
            };
            await needle('GET',process.env.BACKEND_URL+"/instances/status?status=connected",requestOptions)
                .then(function (response) {})
                .catch(function (err) {
                    console.log('WLWebhook connectionConnected error: ' +err)
                });
        } catch (error) {
            console.log('WLWebhook connectionConnected : ' + error)
        }
    }

    async MessageUpsert(sessionId, message) {
        try {
            await needle('post',process.env.WEBHOOK_URL,{
                    conversation: {
                        chat_id: message.remoteJid,
                        lastTime: message.time,
                        lastMessage: message,
                    },
                    sessionId,
                })
                .then(function (response) {})
                .catch(function (err) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpsert' ) : '';
                });


        } catch (error) {
            console.log('WLWebhook MessageUpsert : ' + error)
        }
    }

}
