const Joi = require('joi');
const emailSchema = Joi.string();
const stringSchema = Joi.string();

Joi.objectId = require('joi-objectid')(Joi)

module.exports={
        loginSchema:{
            body:Joi.object().keys({
                email:stringSchema.required(),
                password:stringSchema.required()
                // _id:Joi.objectId().required()
            })
        },
        forgetPasswordSchema:{
            body:Joi.object().keys({
                email:stringSchema.required()
            })
        },
        optVerifySchema:{
            body:Joi.object().keys({
                email:emailSchema.required(),
                otp:Joi.any()
            })
        },
        resetPasswordSchema:{
            body:Joi.object().keys({
                oldPassword:stringSchema.required(),
                newPassword:stringSchema.required()
            })
        },
        addPlayListSchema:{
            body:Joi.object().keys({
                playlist_img:stringSchema,
                playListName:stringSchema.required()
            })
        },
        updatePlayListSchema:{
            body:Joi.object().keys({
                _id:Joi.objectId().required(),
                playListName:stringSchema.optional(),
                listImage:stringSchema.optional()
            })
        },
        deletePlayListSchema:{
            body:Joi.object().keys({
                _id:Joi.objectId().required()
            })
        },
        addArtistschema:{
            body:Joi.object().keys({
                artistName:stringSchema.required(),
                artistImg:stringSchema,
            })
        },
        updateArtistSchema:{
            body:Joi.object().keys({
                _id:Joi.objectId().required(),
                artistName:stringSchema.optional(),
            })
        },
        deleteArtistSchema:{
            body:Joi.object().keys({
                _id:Joi.objectId().required()
            })
        },
        addSongSchema:{
            body:Joi.object().keys({
                songName:stringSchema.required(),
                songFile:stringSchema,
                category:stringSchema.required(),
                artist_id:Joi.objectId().required(),
                type:stringSchema.required(),
                // playList_id:Joi.array().items(Joi.objectId()).optional()
                playList_id: Joi.array().items(Joi.objectId()).single().optional()
            })
        },
        songListSchema:{
            body:Joi.object().keys({
                playList_id: Joi.any(),
                // playList_id: Joi.objectId().optional(),
                song_id:Joi.objectId().optional(),
                page:stringSchema.optional(),
                limit:stringSchema.required(),
                searchQuery:stringSchema.optional()
            })
        },
        deleteSongSchema:{
            body:Joi.object().keys({
                _id:Joi.objectId().required()
            })
        },
        updateSongSchema:{
            body:Joi.object().keys({
                _id:Joi.objectId().required(),
                songName:stringSchema.optional(),
                delete_playlist_id:Joi.objectId().optional(),
                artist_id:Joi.objectId().optional(),
                category:stringSchema.optional(),
                playList_id:Joi.objectId().optional()
            })
        }
}