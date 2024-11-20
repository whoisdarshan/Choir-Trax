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
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['home_page'], true);
                    res.send(finalRes)
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/getHomeSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getHomeSongsSchema),
    function (req, res) {
        userCtrl.getHomeSongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    console.log('😀', resultObj)
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getHome_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/getRecentlySongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getRecentlySongs),
    function (req, res) {
        userCtrl.getRecentlySongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    console.log('😀', resultObj)
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getRecently_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/getPopularSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getPopularSongsSchema),
    function (req, res) {
        userCtrl.getPopularSongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    // console.log('😀',resultObj)
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getPopular_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
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

Router.post('/getByArtistSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getByArtistSongsSchema),
    function (req, res) {
        userCtrl.getByArtistSongs(req, res)
            .then((resultObj) => {
                if (req.query.myCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes)
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getByArtist_songs_success'], true);
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
    function (req, res) {
        userCtrl.gospelSongs(req, res)
            .then((resultObj) => {
                const { type } = req.query
                // if (type == 'true') {
                //     var finalRes = formatter.formatResponse(resultObj, 1, config.messages[''], true);
                //     res.send(finalRes);
                // }
                // else {
                //     var finalRes = formatter.formatResponse(resultObj, 1, config.messages['gospel_page'], true);
                //     res.send(finalRes)
                // }
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['gospel_page'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/getAllGospelSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getAllGospelSongsSchema),
    function (req, res) {
        userCtrl.getAllGospelSongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    console.log('😀', resultObj)
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getAllGospels_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/getGospelSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getGospelSongsSchema),
    function (req, res) {
        userCtrl.getGospelSongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    console.log('😀', resultObj)
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getGospel_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/contemporarySongs',
    upload.none(),
    function (req, res) {
        userCtrl.contemporarySongs(req, res)
            .then((resultObj) => {
                // const { type } = req.query
                // if (type == 'true') {
                //     var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_songs_success'], true);
                //     res.send(finalRes);
                // }
                // else {
                //     var finalRes = formatter.formatResponse(resultObj, 1, config.messages['Contemporary_songs'], true);
                //     res.send(finalRes)
                // }
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['Contemporary_page'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/getContemporarySongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getContemporarySongsSchema),
    function (req, res) {
        userCtrl.getContemporarySongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    console.log('😀', resultObj)
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getContemporary_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
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

Router.post('/getAllContemporaryChristianSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getAllContemporaryChristianSongsSchema),
    function (req, res) {
        userCtrl.getAllContemporaryChristianSongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    console.log('😀', resultObj)
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getAllContemporary_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/hymnsSongs',
    upload.none(),
    function (req, res) {
        userCtrl.hymnsSongs(req, res)
            .then((resultObj) => {
                // const { type } = req.query
                // if (type == 'true') {
                //     var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_songs_success'], true);
                //     res.send(finalRes);
                // }
                // else {
                //     var finalRes = formatter.formatResponse(resultObj, 1, config.messages['Contemporary_songs'], true);
                //     res.send(finalRes)
                // }
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['hymns_page'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/getHymnsSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getHymnsSongsSchema),
    function (req, res) {
        userCtrl.getHymnsSongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    console.log('😀', resultObj)
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getGospel_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/getAllHymnsSongs',
    upload.none(),
    routesMiddlewares.validateRequest(userValidations.getAllHymnsSongsSchema),
    function (req, res) {
        userCtrl.getAllHymnsSongs(req, res)
            .then((resultObj) => {
                if (req.query.addToCart == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_cart_success.'], true);
                    res.send(finalRes);
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['getAllHymns_songs_success'], true);
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
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
                if (req.query.favourite == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_favourite'], true)
                    res.send(finalRes);
                } else if (req.query.password == 'true') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['password_change_success'], true)
                    res.send(finalRes);
                } else {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['profile_update'], true)
                    res.send(finalRes);
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)

Router.post('/myCart',
    upload.none(),
    userVerifyToken,
    function (req, res) {
        userCtrl.myCart(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_cart_success'], true)
                res.send(finalRes);
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes);
            })
    }
)




module.exports = Router