const messages = require('./message');

module.exports = {
    jwt: {
        secret: 'darshan',
        token_expiry: 60 * 60 * 12
    },
    errorCode: {
        SUCCESS_CODE: "1",
        ERROR_CODE: "0",
        REQUEST_VALIDATION_FAILURE: "0",
        UNKNOWN_ERROR: "0"
    },
    messages
}   