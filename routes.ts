import { Router } from 'express'
import instanceRoute from './routes/instanceRoute'
import sessionsRoute from './routes/sessionsRoute'
import messagesRoute from './routes/messagesRoute'
import response from './response'

let router = Router()

router.use('/instances', instanceRoute)
router.use('/sessions', sessionsRoute)
router.use('/messages', messagesRoute)

router.all('*', (req, res) => {
    response(res, 404, false, 'The requested url cannot be found.')
})

export default router
