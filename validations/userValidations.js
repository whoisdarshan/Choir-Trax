const Joi = require('joi');
const { addToCart } = require('../controller/user.controller');
const emailSchema = Joi.string();
const stringSchema = Joi.string();

Joi.objectId = require('joi-objectid')(Joi)

module.exports = {
    sendOtpForSignUpSchema: {
        body: Joi.object().keys({
            email: stringSchema.required()
        })
    },
    signUpSchema: {
        body: Joi.object().keys({
            name: stringSchema.required(),
            email: emailSchema.required(),
            otp: stringSchema.required(),
            phone: stringSchema.required(),
            address: stringSchema.required(),
            password: stringSchema.required(),
            confirmPassword: stringSchema.required()
        })
    },
    loginSchema: {
        body: Joi.object().keys({
            email: emailSchema.required(),
            password: stringSchema.required()
        })
    },
    forgotPasswordSchema: {
        body: Joi.object().keys({
            email: emailSchema.required()
        })
    },
    verifyOtpSchema: {
        body: Joi.object().keys({
            email: emailSchema.required(),
            otp: Joi.any()
        })
    },
    resetPasswordSchema: {
        body: Joi.object().keys({
            old_password: stringSchema.required(),
            new_password: stringSchema.required()
        })
    },
    addFavouriteSchema:{
        body:Joi.object().keys({
            song_id:Joi.objectId().required()
        })
    },
    recentlyPlaylistSongsSchema: {
        body: Joi.object().keys({
            playList_id: Joi.objectId().required(),
            song_id: Joi.objectId().optional(),
        })
    },
    recentlySchema: {
        body: Joi.object().keys({
            search: stringSchema.optional()
        })
    },
    popularSchema: {
        body: Joi.object().keys({
            search: stringSchema.optional()
        })
    },
    popularPlaylistSongsSchema:{
        body:Joi.object().keys({
            song_id:Joi.objectId().optional(),
            popularList_id:Joi.objectId().required(),
        })
    },
    searchByArtistSongsSchema:{
        body:Joi.object().keys({
            song_id:Joi.objectId().optional(),
            artist_id:Joi.objectId().optional(),
        })
    },
    gospelSongsSchema:{
        body:Joi.object().keys({
        })
    },
    contemporarySongsSchema:{
        body:Joi.object().keys({
            type:stringSchema.optional(),
            side:stringSchema.optional()
        })
    },
    updateProfileSchema:{
        body:Joi.object().keys({
            name:stringSchema.optional(),
            phone:stringSchema.optional(),
            address:stringSchema.optional(),
            oldPassword:stringSchema.optional(),
            newPassword:stringSchema.optional(),
            confirmPassword:stringSchema.optional()
        })
    }
}