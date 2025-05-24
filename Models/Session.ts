import Helper from "../helper/Helper";
import { createSession, deleteSession, getSession,sessionsDir } from "../whatsapp";
import WLRedis from './WLRedis';


export default class Session extends Helper {

    private statues = ['connecting', 'connected', 'disconnecting', 'disconnected'];
    private WLRedis;

    constructor() {
        super();
        this.WLRedis = new WLRedis();
    }

    find(req,res) {
        (getSession(req.params.id)) ? this.response(res, 200, true, 'Session found.') : this.response(res, 200, true, 'Session Not found.');
    }

    status(req,res) {
        let state = (getSession(req.params.id)) ?  'connected' : 'disconnected';
        this.response(res, 200, true, '', { status: state })
    }

    add(req, res) {
        // TODO: security session created without auth 
        (this.isSessionExists(req.body.id) == 1) ?
            this.response(res, 409, false, 'Session already exists, please use another id.') : createSession(req.body.id, res);
    }

    del(req, res) {
        (getSession(req.params.id)) ? getSession(req.params.id).logout() : "";
        deleteSession(req.params.id, true);
        createSession(req.params.id, res)
        this.response(res, 200, true, 'The session has been successfully deleted.');
    }

    clearInstance(req, res) {
        (getSession(req.body.id)) ? getSession(req.body.id).logout() : "";
        this.WLRedis.deleteSession(req.body.id);
        deleteSession(req.body.id, true);
        createSession(req.body.id, res)
        this.response(res, 200, true, 'The session has been successfully deleted.');
    }

    clearData(req, res) {
        this.WLRedis.deleteSession(req.body.id);
        this.response(res, 200, true, 'The session data has been successfully deleted.');
    }

}



