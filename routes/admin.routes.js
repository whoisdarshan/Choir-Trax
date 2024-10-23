const express = require('express');
const Router = express.Router();
const adminCtrl = require('../controller/admin.controller');
const config = require('../config/common.config');
const routesMiddlewares = require('../routes/routesMiddleware');
const ResponseFormatter = require('../utils/responseFormatter');
const formatter = new ResponseFormatter();
const fs = require('fs');
const { adminVerifyToken } = require('../helper/verifyToken');
const adminValidations = require('../validations/adminValidations');
const multer = require('multer');
// const adminController = require('../controller/admin.controller');


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
// const multerStorage = multer.diskStorage({
//     destination: function (req, file, cb) {

//         if (file.fieldname  == 'document') {
//             if (fs.existsSync('public/document')) {
//                 fs.mkdirSync('public/document');
//             }

//             cb(null, 'public/document')
//         } else {
//             if (!fs.existsSync('public/document')) {
//                 fs.mkdirSync('public/document')
//             }
//             cb(null, 'public/profile')
//         }
//     },
//     filename: (req, file, cb) => {
//         // console.log('🍕',file)
//         let ext = file.mimetype.split('/')[1];
//         cb(null, `${Date.now()}.${ext}`)
//     }
// })


// const upload = multer({ storage: multerStorage });


Router.post('/login',
    upload.any(),
    routesMiddlewares.validateRequest(adminValidations.loginSchema),
    function (req, res) {
        adminCtrl.login(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['login_success'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/forgetPassword',
    upload.any(),
    routesMiddlewares.validateRequest(adminValidations.forgetPasswordSchema),
    function (req, res) {
        adminCtrl.forgetPassword(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['forget_password'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/optVerify',
    upload.any(),
    routesMiddlewares.validateRequest(adminValidations.optVerifySchema),
    function (req, res) {
        adminCtrl.optVerify(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['otp_verified'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);

Router.post('/resetPassword',
    upload.none(),
    adminVerifyToken,
    routesMiddlewares.validateRequest(adminValidations.resetPasswordSchema),
    function (req, res) {
        adminCtrl.resetPassword(req, res)
            .then((resultObj) => {
                // console.log(resultObj);
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['reset_password_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/showPlayList',
    upload.none(),
    function (req, res) {
        adminCtrl.showPlayList(req, res)
            .then((resultObj) => {
                // console.log(resultObj);
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['list_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/addPlayList',
    upload.single('playlist_img'),
    adminVerifyToken,
    routesMiddlewares.validateRequest(adminValidations.addPlayListSchema),
    function (req, res) {
        adminCtrl.addPlayList(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_playList_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/updatePlayList',
    upload.single('listImage'),
    routesMiddlewares.validateRequest(adminValidations.updatePlayListSchema),
    function (req, res) {
        adminCtrl.updatePlayList(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['update_playList_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);

Router.post('/deletePlayList',
    upload.none(),
    routesMiddlewares.validateRequest(adminValidations.deletePlayListSchema),
    function (req, res) {
        adminCtrl.deletePlayList(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['delete_playList_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/signOut',
    upload.none(),
    adminVerifyToken,
    function (req, res) {
        adminCtrl.signOut(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['signOut_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/artistList',
    upload.none(),
    function (req, res) {
        adminCtrl.artistList(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['list_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/addArtist',
    upload.single('artistImg'),
    routesMiddlewares.validateRequest(adminValidations.addArtistschema),
    function (req, res) {
        adminCtrl.addArtist(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_artist_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/updateArtist',
    upload.single('artistImg'),
    routesMiddlewares.validateRequest(adminValidations.updateArtistSchema),
    function (req, res) {
        adminCtrl.updateArtist(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['update_artist_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/deleteArtist',
    upload.none(),
    routesMiddlewares.validateRequest(adminValidations.deleteArtistSchema),
    function (req, res) {
        adminCtrl.deleteArtist(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['delete_artist_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/addSong',
    upload.single('songFile'),
    routesMiddlewares.validateRequest(adminValidations.addSongSchema),
    function (req, res) {
        adminCtrl.addSong(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_song_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/songList',
    upload.none(),
    routesMiddlewares.validateRequest(adminValidations.songListSchema),
    function (req, res) {
        adminCtrl.songList(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['list_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/deleteSong',
    upload.none(),
    routesMiddlewares.validateRequest(adminValidations.deleteSongSchema),
    function (req, res) {
        adminCtrl.deleteSong(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['delete_song_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/updateSong',
    upload.single('songFile'),
    routesMiddlewares.validateRequest(adminValidations.updateSongSchema),
    function (req, res) {
        adminCtrl.updateSong(req, res)
            .then((resultObj) => {
                
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['song_update_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/userList',
    upload.none(),
    function (req, res) {
        adminCtrl.userList(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['list_success'], true);
                res.json(finalRes)
                console.log('welifiefiehf',finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

module.exports = Router;