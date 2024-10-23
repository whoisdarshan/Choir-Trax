const admin = require('../model/admin_master');
const user = require('../model/user_master');
const Q = require('q');
const ResponseFormatter= require('../utils/responseFormatter');
const formatter=new ResponseFormatter();
const config = require('../config/common.config');

const jwt = require('jsonwebtoken')

exports.userVerifyToken = async (req, res, next) => {
    const deferred = Q.defer();
    try {
        let authorized = req.headers['authorization'];
        // console.log('authorized',authorized);
        if (typeof authorized != 'undefined') {
            let token = authorized.split(' ')[1]
            let decoded = jwt.verify(token, 'darshan')
            const userId = decoded.userId
            let userResponse = await user.findOne({ _id: userId, deleted_at: null })
            if (userResponse) {
                req.user = userResponse;
                next();
            } else {
                deferred.reject("User not found or has been deleted.");
            }
        }
    } catch (errorCode) {
        console.log("Invalid Token",errorCode);
        var finalRes = formatter.formatResponse({}, 0, config.messages["incorrect token"], false);
        return res.send(finalRes);
    }
    return deferred.promise;
}

exports.adminVerifyToken = async (req, res, next) => {
    const deferred = Q.defer();
    try {
        let authorized = req.headers['authorization'];
        if (typeof authorized != 'undefined') {
            let token = authorized.split(' ')[1]
            let decoded = jwt.verify(token, 'darshan')
            const adminId = decoded.adminId
            let adminResponse = await admin.findOne({ _id: adminId, deleted_at: null })
            if (adminResponse) {
                req.admin = adminResponse;
                next();
            } else {
                deferred.reject("Admin not found or has been deleted.");
            }
        }
    } catch (error) {
        console.log(error);
        deferred.reject(error);
    }
    return deferred.promise;
}