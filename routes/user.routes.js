const express = require('express');
const Router = express.Router();
const config = require('../config/common.config');
const userCtrl = require('../controller/user.controller');
const routesMiddlewares = require('../routes/routesMiddleware');
const ResponseFormatter = require('../utils/responseFormatter');
const formatter = new ResponseFormatter();
const fs = require('fs');
const { userVerifyToken } = require('../helper/verifyToken');
const userValidations = require('../validations/userValidations');
const multer = require('multer');
const { error } = require('console');

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {

        if (file.fieldname == 'document') {
            if (fs.existsSync('public/document')) {
                fs.mkdirSync('public/document');
            }

            cb(null, 'public/document')
        } else {
            if (!fs.existsSync('public/profile')) {
                fs.mkdirSync('public/profile')
            }
            cb(null, 'public/profile')
        }
    },
    filename: (req, file, cb) => {
        // console.log('🍕',file)
        let ext = file.mimetype.split('/')[1];
        cb(null, `${Date.now()}.${ext}`)
    }
})

const upload = multer({ storage: multerStorage });

Router.post('/sendOtpForSignUp',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.sendOtpForSignUpSchema),
    function (req, res) {
        userCtrl.sendOtpForSignUp(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['send_otp_success'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/signUp',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.signUpSchema),
    function (req, res) {
        userCtrl.signUp(req, res)
            .then((resultObj) => {
                console.log('😂', resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['register_complete'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/login',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.loginSchema),
    function (req, res) {
        userCtrl.login(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['login_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/forgotPassword',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.forgotPasswordSchema),
    userVerifyToken,
    function (req, res) {
        userCtrl.forgotPassword(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['forget_password'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/verifyOtp',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.verifyOtpSchema),
    function (req, res) {
        userCtrl.verifyOtp(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['otp_verified'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/resetPassword',
    upload.none(),
    userVerifyToken,
    routesMiddlewares.validateRequest(userValidations.resetPasswordSchema),
    function (req, res) {
        userCtrl.resetPassword(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['reset_password_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/home',
    upload.none(),
    function (req, res) {
        userCtrl.home(req, res)
            .then((resultObj) => {
                if (req.query.side == 'recently') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_recently_songs_success'], true);
                    res.send(finalRes);
                } else if (req.query.side == 'popular') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_popular_songs_success'], true);
                    res.send(finalRes)
                }else{
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['home_page'], true);
                    res.send(finalRes)
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/addFavourite',
    upload.none(),
    userVerifyToken,
    routesMiddlewares.validateRequest(userValidations.addFavouriteSchema),
    function (req, res) {
        userCtrl.addFavourite(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_favourite_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/recentlyPlaylistSongs',
    upload.none(),
    userVerifyToken,
    routesMiddlewares.validateRequest(userValidations.recentlyPlaylistSongsSchema),
    function (req, res) {
        userCtrl.recentlyPlaylistSongs(req, res)
            .then((resultObj) => {
                const { type } = req.query;
                if (req.query.myCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes)
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_songs_success'], true);
                    res.send(finalRes)
                }

            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/popularPlaylistSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.popularPlaylistSongsSchema),
    userVerifyToken,
    function (req, res) {
        userCtrl.popularPlaylistSongs(req, res)
            .then((resultObj) => {
                const { type } = req.query;
                if (req.query.myCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes)
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_songs_success'], true);
                    res.send(finalRes)
                }

            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/searchByArtist',
    upload.none(),
    function (req, res) {
        userCtrl.searchByArtist(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_artists_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/searchByArtistSongs',
    upload.none(),
    userVerifyToken,
    routesMiddlewares.validateRequest(userValidations.searchByArtistSongsSchema),
    function (req, res) {
        userCtrl.searchByArtistSongs(req, res)
            .then((resultObj) => {
                if (req.query.myCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes)
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_songs_success'], true);
                    res.send(finalRes)
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/gospelSongs',
    upload.none(),
    userVerifyToken,
    function (req, res) {
        userCtrl.gospelSongs(req, res)
            .then((resultObj) => {
                const { type } = req.query
                if (req.query.myCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes)
                } else if (type == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_songs_success'], true);
                    res.send(finalRes);
                }
                else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['gospel_page'], true);
                    res.send(finalRes)
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/contemporarySongs',
    upload.none(),
    userVerifyToken,
    // routesMiddlewares.validateRequest(userValidations.contemporarySongsSchema),
    function (req, res) {
        userCtrl.contemporarySongs(req, res)
            .then((resultObj) => {
                const { type } = req.query
                if (req.query.myCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes)
                } else if (type == 'true') {
                    console.log('👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍', resultObj);
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_songs_success'], true);
                    console.log('👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍', finalRes);

                    res.send(finalRes);
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['contemporary_page'], true);
                    console.log('👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍', finalRes);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/updateProfile',
    upload.none(),
    userVerifyToken,
    routesMiddlewares.validateRequest(userValidations.updateProfileSchema),
    function (req, res) {
        userCtrl.updateProfile(req, res)
            .then((resultObj) => {
                if (req.query.password == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['password_change_success'], true);
                    res.send(finalRes);
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['profile_update'], true)
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)





module.exports = Router