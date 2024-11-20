const adminMaster = require('../model/admin_master');
const adminController = {};
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const public = basedir + '/public/';
const sendMail = require('../utils/sendMail');
const Q = require('q');
const OTPMaster = require('../model/opt_master');
const config = require('../config/common.config');
const { forgotPasswordMail } = require("../utils/contentProvider");
const playListMaster = require('../model/playlist_master');
const userMaster = require('../model/user_master');
const artistMaster = require('../model/artist_master');
const songMaster = require('../model/song_master');
let publicPath = basedir + '/public/';
const fs = require('fs');
const path = require('path');
const { create } = require('domain');
let baseURL = 'http://localhost:3456/public/';
// let publicPath = path.join(basedir, 'public/');

(async () => {
    try {
        const findAdmin = await adminMaster.findOne({ email: "admin@gmail.com" });
        // console.log("kjbdbuevueuevu")
        if (!findAdmin) {
            const adminObj = new adminMaster({
                name: "admin",
                email: "admin@gmail.com",
                password: "123"
            }).save()
        }
    } catch (error) {
        return error
    }
})();

adminController.login = async (req, res) => {
    const deferred = Q.defer();
    const { email, password } = req.body;
    try {
        const adminResponse = await adminMaster.findOne({ email: email, deleted_at: null });
        if (adminResponse) {
            if (adminResponse.password == password) {
                let payLoad = {
                    adminId: adminResponse._id
                }
                let token = jwt.sign(payLoad, config.jwt.secret, { expiresIn: config.jwt.token_expiry });
                deferred.resolve(token);
            } else {
                deferred.reject("Your password is incorrect.")
            }
        } else {
            deferred.reject("We are not able to find this admin");
        }
    } catch (error) {
        console.log('adminController.login-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.forgetPassword = async (req, res) => {
    const deferred = Q.defer();
    const { email } = req.body;
    try {
        let otpCode = makeid(4);
        let new_otp = new OTPMaster();
        new_otp.otp_code = otpCode;
        new_otp.email = email;
        new_otp.expiresIn = new Date();
        new_otp.save();

        let adminResponse = await adminMaster.findOneAndUpdate({ email: email }, { ccode: otpCode }, { new: true });
        if (adminResponse) {
            let mailContent = forgotPasswordMail(adminResponse.name, otpCode)
            sendMail(email, "Forget password mail", mailContent)
            deferred.resolve({ adminResponse, otp_code: otpCode });
        } else {
            deferred.reject("Your email is incorrect.")
        }
    } catch (error) {
        console.log('userController.forgetPassword', error)
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.optVerify = async (req, res) => {
    const deferred = Q.defer();
    const { otp, email } = req.body
    try {
        let checkOtp = await OTPMaster.findOne({ otp_code: otp, email: email });
        console.log('qwoeboibeviepvivb', checkOtp)
        if (checkOtp != null) {
            await OTPMaster.deleteOne({ _id: checkOtp._id });
            deferred.resolve({})
        }
        deferred.reject("Invalid Otp.")
    } catch (error) {
        console.log('userController.optVerify'.error);
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.resetPassword = async (req, res) => {
    const deferred = Q.defer();
    const { oldPassword, newPassword } = req.body;
    try {
        let admin = req.admin;
        if (!admin) {
            deferred.reject("Invalid Token");
            return deferred.promise;
        }
        if (admin != null) {
            if (admin.password != oldPassword) {
                deferred.reject('incorrect_password')
            } else if (admin.password == newPassword) {
                deferred.reject('check_password')
            }
            await adminMaster.findByIdAndUpdate(admin._id, { password: newPassword }, { new: true });
            deferred.resolve({});
        } else {
            deferred.reject('We are not able to find this admin');
        }
    } catch (error) {
        console.log('usercontroller.resetPassword', error);
        deferred.reject(error)
    }
    return deferred.promise;
}

adminController.showPlayList = async (req, res) => {
    const deferred = Q.defer();
    const { page = 1, limit = 10, searchQuery = '' } = req.query;
    try {
        let query = { deleted_at: null };

        if (searchQuery) {
            query.playListName = { $regex: new RegExp(searchQuery, 'i') };
        }

        const totalCount = await playListMaster.countDocuments(query);
        console.log(totalCount);

        let playList = await playListMaster.find(query)
            .select('playListName playlist_img')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        console.log(playList);

        if (playList == '') {
            deferred.reject("Empty Play List.")
            return deferred.promise;
        }

        //pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        console.log(totalPages)
        const currentPage = parseInt(page);
        console.log(currentPage)

        deferred.resolve({ playList, totalPages, currentPage, totalCount });
    } catch (error) {
        console.log('adminController.showPlayList', error);
        deferred.reject(error);
    }
    return deferred.promise
}

// adminController.showPlayList = async (req, res) => {
//     const deferred = Q.defer();
//     const {page=1,limit=10,searchQuery='' } = req.query;
//     try {
//         let playList = await playListMaster.find({ deleted_at: null }).select('-_id playListName listImage').sort({createdAt:-1})
//         if (playList == '') {
//             deferred.reject("Empty play list.");
//             return deferred.promise
//         }
//         deferred.resolve(playList);
//     } catch (error) {
//         console.log('adminController.showPlayList', error);
//         deferred.reject(error);
//     }
//     return deferred.promise
// }

adminController.addPlayList = async (req, res) => {
    const deferred = Q.defer();
    const { playListName, listImage } = req.body;
    try {
        let admin = req.admin;
        if (!admin) {
            deferred.reject('Invalid admin token')
            return deferred.promise;
        }
        let existPlayList = await playListMaster.findOne({ playListName: playListName });
        if (existPlayList) {
            deferred.reject("You already added this playList.Please add different playListr.");
            return deferred.promise;
        }
        let playlist_img = req.file ? req.file.filename : '';
        if (playlist_img) {
            let adminResponse = await adminMaster.findById(admin);
            if (adminResponse && adminResponse.playlist_img) {
                let oldPath = publicPath + 'profile/' + adminResponse.playlist_img
                fs.unlink(oldPath, (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
        }
        let addPlaylist = await playListMaster.create({ playListName: playListName, playlist_img: playlist_img });
        deferred.resolve(addPlaylist);
    } catch (error) {
        console.log('adminController.addPlayList', error);
        deferred.reject(error);
    }
    return deferred.promise
}

adminController.updatePlayList = async (req, res) => {
    const deferred = Q.defer();
    const { _id, playListName } = req.body;
    try {
        let listImage = req.file ? req.file.filename : '';
        let listResponse = await playListMaster.findById(_id);
        if (!listResponse) {
            deferred.reject("We are not able to find this playList.");
            return deferred.promise;
        }
        if (listImage) {
            // console.log('🍕',listResponse.listImage)
            if (listResponse.listImage) {
                let oldPath = publicPath + 'profile/' + listResponse.listImage;
                // console.log('🍕',oldPath)
                fs.unlink(oldPath, (err) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Old Path deleted successfull.", oldPath);
                    }
                })
            }
        }
        let updateList = await playListMaster.findByIdAndUpdate(_id, { playListName: playListName, ...(listImage && { listImage: listImage }) }, { new: true });
        // console.log(updateList);
        deferred.resolve(updateList);
    } catch (error) {
        console.log('adminController.updatePlayList-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.deletePlayList = async (req, res) => {
    const deferred = Q.defer();
    const { _id } = req.body;
    try {
        let listResponse = await playListMaster.findById(_id);
        if (!listResponse) {
            deferred.reject("We are not able to find this playList.")
            return deferred.promise;
        }
        if (listResponse) {
            let oldPath = publicPath + 'profile/' + listResponse.listImage
            fs.unlink(oldPath, (err) => {
                if (err) {
                    console.log(err)
                }
            })
            await playListMaster.findByIdAndDelete(_id);
            deferred.resolve({});
        } else {
            deferred.reject("We are not able to find this play list.")
        }
    } catch (error) {
        console.log('adminController.deletePlayList', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.signOut = async (req, res) => {
    const deferred = Q.defer();
    const { } = req.body;
    try {
        let adminResponse = req.admin;
        if (adminResponse) {
            await adminMaster.findById(adminResponse);
            deferred.resolve({});
        } else {
            deferred.reject("We are not able to find this admin");
        }
    } catch (error) {
        console.log('adminController.signOut-', error);
    }
    return deferred.promise;
}

adminController.artistList = async (req, res) => {
    const deferred = Q.defer();
    const { page = 1, limit = 10, searchQuery = '' } = req.query;
    try {

        let query = { deleted_at: null };

        if (searchQuery) {
            query.artistName = { $regex: new RegExp(searchQuery) }
            // query.artistName = { $regex: new RegExp(searchQuery, 'i') } // if i search a letter of any size like small or capital they show all data which is related.
        }

        const totalCount = await artistMaster.countDocuments(query);
        console.log('👌', totalCount)

        let artistList = await artistMaster.find(query)
            .select('artistName artistImg')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))

        console.log('👌', artistList)

        if (artistList == '') {
            deferred.reject("Empty artist list.")
            return deferred.promise;
        }

        let totalPages = Math.ceil(totalCount / limit);
        console.log('👌', totalPages)
        let currentPage = parseInt(page);
        console.log('👌', currentPage)

        deferred.resolve({ artistList, totalPages, currentPage, totalCount });

    } catch (error) {
        console.log('adminController.artistList-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.addArtist = async (req, res) => {
    const deferred = Q.defer();
    const { artistName, artistImg } = req.body;
    try {
        let artistImg = req.file ? req.file.filename : ''
        if (artistImg) {
            let existArtist = await artistMaster.findOne({ artistName: artistName });
            if (existArtist) {
                deferred.reject("You already added this artist.Please use differenet name and image.");
                return deferred.promise;
            }
            let createArtist = new artistMaster();
            createArtist.artistName = artistName;
            createArtist.artistImg = artistImg;
            await createArtist.save();
            deferred.resolve(createArtist);
        }
    } catch (error) {
        console.log('adminController.addArtist-', error);
        deferred.reject(error)
    }
    return deferred.promise;
}

adminController.updateArtist = async (req, res) => {
    const deferred = Q.defer();
    const { _id, artistName } = req.body;
    try {
        let artistImg = req.file ? req.file.filename : '';
        let artistResponse = await artistMaster.findById(_id)
        if (!artistResponse) {
            deferred.reject("We are not able to find this artist.");
            return deferred.promise;
        }
        if (artistImg) {
            if (artistResponse.artistImg) {
                let oldPath = publicPath + 'profile/' + artistResponse.artistImg;
                fs.unlink(oldPath, (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
        }

        let updateArtist = await artistMaster.findByIdAndUpdate(_id, { artistName: artistName, ...(artistImg && { artistImg: artistImg }) }, { new: true });
        deferred.resolve(updateArtist);

    } catch (error) {
        console.log('adminController.updateArtist-', error);
        deferred.reject(error)
    }
    return deferred.promise;
}

adminController.deleteArtist = async (req, res) => {
    const deferred = Q.defer();
    const { _id } = req.body;
    try {
        let artistResponse = await artistMaster.findById(_id);
        if (!artistResponse) {
            deferred.reject("We are not able to find this artist.");
            return deferred.promise;
        }
        if (artistResponse) {
            let oldPath = publicPath + 'profile/' + artistResponse.artistImg;
            fs.unlink(oldPath, (err) => {
                if (err) {
                    console.log(err);
                }
            })
            await artistMaster.findByIdAndDelete(_id)
            deferred.resolve({});
        } else {
            deferred.reject("We are not able to find this artist.");
        }
    } catch (error) {
        console.log('adminController.deleteArtist-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

// adminController.songList = async (req, res) => {
//     const deferred = Q.defer();
//     const { playList_id, page = 1, limit = 10, searchQuery = '' ,song_id} = req.body;
//     // const { page = 1, limit = 10, searchQuery = '' } = req.query
//     try {
//         let query = {
//             deleted_at: null,
//         }
//         if (searchQuery) {
//             query.songName = { $regex: new RegExp(searchQuery) }
//         }

//         let showSongs = await songMaster.aggregate([
//             {
//                 $match: {
//                    ...query
//                     // playList_id: playList_id              // Ensure playList_id exists in songMaster
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'artist_masters',
//                     localField: 'artist_id',
//                     foreignField: '_id',
//                     as: 'artistDetails'
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$artistDetails",
//                     preserveNullAndEmptyArrays: false
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     songName: 1,
//                     songFile:{$concat:[baseURL,'profile/','$songFile']},
//                     artistName:'$artistDetails.artistName',
//                     artist_id:'$artistDetails._id',
//                 }
//             }
//         ])
//             .sort({ createdAt: -1 })
//             .skip((page - 1) * limit)
//             .limit(parseInt(limit))

//         if (showSongs == '') {
//             deferred.reject("There is no songs available yet.");
//             return deferred.promise;
//         }

//         if(song_id){
// const song= await songMaster.findById(song_id);
// if(playList_id){
//     const existPlayListIds= playList_id.filter(id=>song.includes(id));
//     if(existPlayListIds){
//         deferred.reject("You already added this playList.Please add different playList.");
//     }
//     await findByIdAndUpdate(song_id,{$push:{playList_id:{$in:playList_id}}});
//     addMessage:'PlayList Added successfull'
// }
//             await songMaster.findByIdAndUpdate(song_id,{$addToSet:{playList_id:playList_id}},{new:true});
//         }

//         let totalCount = await songMaster.countDocuments(query);
//         let totalPages = Math.ceil(totalCount / limit);

//         const response={
//             showSongs,
//             totalPages:totalPages,
//             totalCount:totalCount
//         }
//         // deferred.resolve(showSongs,{totalPages, totalCount });
//         deferred.resolve(response);

//     } catch (error) {
//         console.log('adminController.songList-', error)
//         deferred.reject(error);
//     }
//     return deferred.promise;
// }

adminController.songList = async (req, res) => {
    const deferred = Q.defer();
    const { playList_id, song_id, page = 1, limit = 10, searchQuery = '' } = req.body;

    try {
        let query = {
            deleted_at: null
        };
        let addMessage = '';

        if (searchQuery) {
            query.songName = { $regex: new RegExp(searchQuery, 'i') };
        }
        if (song_id && playList_id) {
            const song = await songMaster.findById(song_id);

            if (!song) {
                deferred.reject("Song not found...");
            }

            const existingPlaylists = song.playList_id || [];

            const playlistsToAdd = Array.isArray(playList_id) ? playList_id : [playList_id];

            const alreadyAddedPlaylists = playlistsToAdd.filter(id => existingPlaylists.includes(id));
            console.log('🤷‍♀️', alreadyAddedPlaylists)

            if (alreadyAddedPlaylists.length > 0) {
                deferred.reject("These playlists are already added.");
                return deferred.promise;
            }

            await songMaster.findByIdAndUpdate(
                { _id: song_id },
                { $addToSet: { playList_id } },
                // { $push: { playList_id:{$each:playList_id}  } },
                { new: true }
            );
            addMessage = "Playlists added successfully.";
        }

        let showSongs = await songMaster.aggregate([
            {
                $match: { ...query }
            },
            {
                $lookup: {
                    from: 'artist_masters',
                    localField: 'artist_id',
                    foreignField: '_id',
                    as: 'artistDetails'
                }
            },
            {
                $unwind: {
                    path: "$artistDetails",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 1,
                    songName: 1,
                    songFile: { $concat: [baseURL, 'profile/', '$songFile'] },
                    artistName: "$artistDetails.artistName",
                    artist_id: "$artistDetails._id",
                }
            }
        ])
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        if (!showSongs || showSongs.length === 0) {
            deferred.reject("No songs available.");
            return deferred.promise;
        }

        let totalCount = await songMaster.countDocuments(query);
        let totalPages = Math.ceil(totalCount / limit);

        const response = {
            showSongs,
            totalPages,
            totalCount
        }

        // deferred.resolve({ showSongs, totalPages, totalCount });
        if (addMessage) {
            response.messgae = addMessage;
        }
        deferred.resolve(response);
        // deferred.resolve({ showSongs, totalPages, totalCount, message: addMessage || null });
    } catch (error) {
        deferred.reject(error);
    }
    return deferred.promise;
};

// adminController.addSong = async (req, res) => {
//     const deferred = Q.defer();
//     const { songName, artist_id, type, category,playList_id} = req.body;
//     try {
//         let artistResponse = await artistMaster.findById({ _id: artist_id });
//         if (!artistResponse) {
//             deferred.reject("We are not able to find this artist");
//             return deferred.promise
//         }

//         const playlistIdsArray = Array.isArray(playList_id) ? playList_id : [playList_id];

//         // Check if all playlist IDs exist in the playListMaster collection
//         const playlists = await playListMaster.find({ 
//             _id: { $in: playlistIdsArray }, 
//             deleted_at: null 
//         }).select('_id');

//         const validPlaylistIds = playlists.map(playlist => playlist._id.toString());
//         console.log('😀',validPlaylistIds);
//         const invalidPlaylistIds = playlistIdsArray.filter(id => !validPlaylistIds.includes(id));  //  ! i put this because it give true  if only validplaylistids.include then they give me false but i need true answeer that's why i use ! operator
//         console.log('😀',invalidPlaylistIds);
//         if(invalidPlaylistIds.length>0 ){
//             deferred.reject(`The following playlist IDs are invalid: ${invalidPlaylistIds.join(", ")}`);
//         }

//         let existSong = await songMaster.findOne({ songName: songName });
//         if (existSong) {
//             deferred.reject("song_already_exist");
//             return deferred.promise;
//         }

//         songFile = req.file.filename;
//         let createSong = await songMaster.create({
//             songName,
//             songFile: songFile,
//             playList_id:validPlaylistIds,
//             category,
//             artist_id: artist_id,
//             type
//         });

//         const baseURL = req.protocol + '://' + req.get('host') + '/public/profile/';
//         createSong.songFile = baseURL + songFile;
//         deferred.resolve(createSong);

//     } catch (error) {
//         console.log('adminController.addSong-', error)
//         deferred.reject(error);
//     }
//     return deferred.promise;
// }

adminController.addSong = async (req, res) => {
    const deferred = Q.defer(); // Using Q for promise handling
    const { songName, artist_id, type, category, playList_id } = req.body;

    try {
        // Check if the artist exists
        const artistResponse = await artistMaster.findById(artist_id);
        if (!artistResponse) {
            deferred.reject("We are not able to find this artist");
            return deferred.promise; // Exit if artist not found
        }

        // Ensure playList_id is always an array
        const playlistIdsArray = Array.isArray(playList_id) ? playList_id : [playList_id];
        
        // Check if all playlist IDs exist in the playListMaster collection
        const playlists = await playListMaster.find({ 
            _id: { $in: playlistIdsArray }, 
            deleted_at: null 
        }).select('_id');

        // Collect valid IDs
        const validPlaylistIds = playlists.map(playlist => playlist._id.toString());

        // Check for invalid IDs
        const invalidPlaylistIds = playlistIdsArray.filter(id => !validPlaylistIds.includes(id));
        if (invalidPlaylistIds.length > 0) {
            deferred.reject(`The following playlist IDs are invalid: ${invalidPlaylistIds.join(", ")}`);
            return deferred.promise; // Exit if invalid IDs found
        }

        // Check if the song already exists
        const existSong = await songMaster.findOne({ songName: songName });
        if (existSong) {
            deferred.reject("song_already_exist");
            return deferred.promise; // Exit if song exists
        }

        // Handle the song file
        if (!req.file || !req.file.filename) {
            deferred.reject("Song file is required");
            return deferred.promise; // Exit if the file is not provided
        }

        const songFile = req.file.filename; // Assuming you are uploading the file correctly

        // Create the song in the database
        const createSong = await songMaster.create({
            songName,
            songFile: songFile,
            playList_id: validPlaylistIds, // Use validated playlist IDs
            category,
            artist_id: artist_id,
            type
        });

        // Construct the file URL
        const baseURL = req.protocol + '://' + req.get('host') + '/public/profile/';
        createSong.songFile = baseURL + songFile; // Update songFile with the full URL
        deferred.resolve(createSong); // Resolve promise with the created song

    } catch (error) {
        deferred.reject(error); // Handle errors
    }
    return deferred.promise; // Return the promise
}


adminController.deleteSong = async (req, res) => {
    const deferred = Q.defer();
    const { _id } = req.body;
    try {
        let songResponse = await songMaster.findById(_id);
        if (songResponse) {
            let oldPath = publicPath + 'profile/' + songResponse.songFile
            fs.unlink(oldPath, (err) => {
                if (err) {
                    console.log(err)
                }
            })
            await songMaster.findByIdAndDelete(_id);
            deferred.resolve({});
        } else {
            deferred.reject("We are not able to find this song.")
        }
    } catch (error) {
        console.log('adminController.deleteSong', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.updateSong = async (req, res) => {
    const deferred = Q.defer();
    const { _id, artist_id, playList_id, category, songName, delete_playlist_id } = req.body;
    try {
        let songFile = req.file ? req.file.filename : '';
        let songResponse = await songMaster.findById(_id)
        if (!songResponse) {
            deferred.reject("We are not able to find this song.");
            return deferred.promise;
        }
        if (songFile) {
            // let oldPath = path.join(__dirname,'../public/profile',songResponse.songFile.split('/').pop());
            // let oldPath = path.join(__dirname, '../public/profile', songResponse.songFile);
            let oldPath = publicPath + 'profile/' + songResponse.songFile
            fs.unlink(oldPath, (err) => {
                if (err) {
                    console.log(err)
                }
            })
        }

        if (delete_playlist_id) {
            await songMaster.findByIdAndUpdate(_id, { $pull: { playList_id: delete_playlist_id } }, { new: true });
        }

        let updateSong = await songMaster.findByIdAndUpdate({ _id: _id }, { artist_id: artist_id, playList_id: playList_id, category: category, songName: songName, ...(songFile && { songFile: songFile }) }, { new: true });
        // let updateSong = await songMaster.findByIdAndUpdate({ _id: _id }, { artist_id: artist_id, playList_id: playList_id, category: category, songName: songName, ...(songFile && { songFile: songFile }) }, { new: true });

        if (playList_id) {
            await findByIdAndUpdate(_id, { $push: { playList_id: playList_id } }, { new: true });
        }
        deferred.resolve(updateSong);
    } catch (error) {
        console.log('adminController.updateSong', error);
        deferred.reject(error);
    }
    return deferred.promise
}

adminController.userList = async (req, res) => {
    const deferred = Q.defer();
    try {
        const userlist = await userMaster.find({ deleted_at: null })
        // const userlist = await userMaster.find({ deleted_at: null }).select('name email phone address');
        console.log(userlist);
        deferred.resolve(userlist);
        // if(userlist){
        //     deferred.resolve(userlist); 
        // }else{
        //     deferred.reject("We are not able to find any users.");
        // }
    } catch (error) {
        console.log('adminController.userList', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

function makeid(length) {
    let result = '';
    let characters = '123456789';
    let characterLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characterLength))
    }
    return result;
}   

module.exports = adminController;