const Joi = require('@hapi/joi');
const validateRequest = require('../middlewares/validate-requests');

function loginSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        dob: Joi.date().required(),
        address: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

module.exports = {
    loginSchema,
    registerSchema
}