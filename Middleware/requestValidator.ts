import { validationResult } from 'express-validator'
import response from '../response'

const validate = (req:any, res:any, next:any) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return response(res, 400, false, 'Please fill out all required input.')
    }

    next()
}

export default validate
