const userMaster = require('../model/user_master');
const userController = {};
const jwt = require('jsonwebtoken')
const fs = require('fs');
const sendMail = require('../utils/sendMail');
const Q = require('q');
const OTPMaster = require('../model/opt_master');
const mongoose = require('mongoose');
const favouriteMaster = require('../model/favourite_master');
const config = require('../config/common.config');
const { forgotPasswordMail } = require('../utils/contentProvider');
const cartMaster = require('../model/cart_master');
const playListMaster = require('../model/playlist_master');
const artistMaster = require('../model/artist_master');
const songMaster = require('../model/song_master');
const { Console } = require('console');
const path = require('path');
const { exist } = require('joi');
const { song_already_exist } = require('../config/message');
let publicPath = basedir + '/public/';
const baseURL = 'http://localhost:3456/public/';

userController.sendOtpForSignUp = async (req, res) => {
    const deferred = Q.defer();
    const { email } = req.body;
    try {
        let user = await userMaster.findOne({ email: email, deleted_at: null });
        if (user) {
            deferred.reject("already_registered")
            return deferred.promise;
        }

        let otp_code = makeid(4);
        let new_otp = new OTPMaster();
        new_otp.otp_code = otp_code;
        new_otp.email = email
        new_otp.expireAt = new Date();
        new_otp.save()
        deferred.resolve(new_otp.otp_code);
    } catch (error) {
        console.log('userController.sendOtpForSignUp', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.signUp = async (req, res) => {
    const deferred = Q.defer()
    const { otp, name, email, phone, address, password, confirmPassword } = req.body;
    try {
        let otpData = await OTPMaster.findOne({ otp_code: otp, email: email });
        if (!otpData) {
            deferred.reject("invalid_otp")
            return deferred.promise;
        }

        if (otpData.otp_code == otp) {
            let checkUser = await userMaster.findOne({ email: email, deleted_at: null });
            if (checkUser) {
                deferred.reject('already_register_email')
            } else if (password != confirmPassword) {
                deferred.reject("confirmPassword is not match with password.Please enter correct password in confirm password.");
            } else {
                const adduser = new userMaster({
                    name,
                    email,
                    phone,
                    address,
                    password,
                    confirmPassword
                })
                await adduser.save()
                if (adduser) {
                    await OTPMaster.deleteOne({ _id: otpData._id });
                }
                console.log(adduser);
                deferred.resolve(adduser);
            }
        } else {
            deferred.reject('invalid_otp');
        }
    } catch (error) {
        console.log('userController.signUp-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.login = async (req, res) => {
    const deferred = Q.defer();
    const { email, password } = req.body;
    try {
        const userResonse = await userMaster.findOne({ email: email, deleted_at: null });
        if (!userResonse) {
            deferred.reject("We are not able to find this user.");
            return deferred.promise;
        }
        if (userResonse.password == password) {
            let payLoad = {
                userId: userResonse._id
            }
            let token = jwt.sign(payLoad, config.jwt.secret, { expiresIn: config.jwt.token_expiry });
            deferred.resolve(token);
        } else {
            deferred.reject("incorrect_password");
        }
    } catch (error) {
        console.log('userController.login-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.forgotPassword = async (req, res) => {
    const deferred = Q.defer();
    const { email } = req.body;
    try {
        let user = req.user;
        console.log(user);
        if (!user) {
            deferred.reject('invalid_user_id')
            return deferred.promise;
        }

        let otp_code = makeid(4);
        let new_otp = new OTPMaster();
        new_otp.otp_code = otp_code;
        new_otp.email = email;
        new_otp.expiresIn = new Date();
        new_otp.save();

        let userResponse = await userMaster.findByIdAndUpdate(user._id, { ccode: otp_code }, { new: true });
        if (userResponse) {
            let mailContent = forgotPasswordMail(user.name, otp_code);
            sendMail(email, "Forgot Password Mail", mailContent);
            deferred.resolve({ user, otp_code: otp_code })
        }
    } catch (error) {
        console.log('userController.forgotPassword-', error)
        deferred.reject(error)
    }
    return deferred.promise;
}

userController.verifyOtp = async (req, res) => {
    const deferred = Q.defer();
    const { email, otp } = req.body;
    try {
        let checkOtp = await OTPMaster.findOne({ email: email, otp_code: otp });
        console.log(checkOtp);
        if (checkOtp) {
            await OTPMaster.deleteOne({ _id: checkOtp._id });
            deferred.resolve({});
        } else {
            deferred.reject('invalid_otp');
        }
    } catch (error) {
        console.log('usercontroller.verifyOtp-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.resetPassword = async (req, res) => {
    const deferred = Q.defer();
    const { old_password, new_password, confirm_password } = req.body;
    try {
        const userResponse = req.user;
        if (!userResponse) {
            deferred.reject("invalid_user_id")
            return deferred.promise;
        }
        if (userResponse != null) {
            if (userResponse.password != old_password) {
                deferred.reject('check_old_password')
            } else if (old_password == new_password) {
                deferred.reject('check_password');
            }
            await userMaster.findByIdAndUpdate(userResponse._id, { password: new_password }, { new: true });
            deferred.resolve({});
        } else {
            deferred.reject("invalid_user_id");
        }

    } catch (error) {
        console.log('userController.resetPassword-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.recently = async (req, res) => {
    const deferred = Q.defer();
    try {
        const search = req.query.search || '';

        const recentlySongs = await songMaster.aggregate([
            {
                $match: {
                    deleted_at: null,
                    createdAt: { $gte: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
                    ...(search && { songName: { $regex: new RegExp(search, 'i') } })
                }
            },
            // Unwind the playlist_id array so each playlist_id is treated as separate
            {
                $unwind: '$playList_id' // Assuming 'playlist_id' is an array
            },
            // Lookup playlist details for each playlist_id
            {
                $lookup: {
                    from: 'playlist_masters', // Assuming your playlist collection is named 'playlists'
                    localField: 'playList_id', // The current 'playlist_id' after unwind
                    foreignField: '_id',
                    as: 'playlistDetails'
                }
            },
            {
                $unwind: '$playlistDetails'
            },
            { $sort: { createdAt: -1 } },
            { $limit: 4 }
        ]);

        const songs = recentlySongs.map(song => ({
            _id: song._id,
            songName: song.songName,
            playListName: song.playlistDetails.playListName,
            playlist_img: baseURL + 'profile/' + song.playlistDetails.playlist_img // Assuming the image path is stored in playlist_img
        }));

        deferred.resolve(songs);

        // const recentlySongs = await songMaster.find({
        //     deleted_at: null,
        //     createdAt: { $gte: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
        //     ...(search && { songName: { $regex: new RegExp(search, 'i') } })
        // })
        //     .sort({ createdAt: -1 })
        //     .limit(3)
        // const songs = recentlySongs.map(song => ({
        //     _id: song._id,
        //     songName: song.songName,
        //     songFile: baseURL + 'profile/' + song.songFile
        // }))


        // deferred.resolve(songs);
    } catch (error) {
        console.error('userController.recently-', error);
        deferred.reject(error);
    }
    return deferred.promise;
};

// userController.popular = async (req, res) => {
//     const deferred = Q.defer();
//     try {
//         const search = req.query.search || '';

//         const popularPlaylists = await playListMaster.aggregate([
//             {
//                 $lookup: {
//                     from: 'song_masters',
//                     localField: '_id',
//                     foreignField: 'playList_id',
//                     as: 'songs'
//                 }
//             },
//             {
//                 $unwind: '$songs'
//             },
//             {
//                 $match: {
//                     deleted_at: null,
//                     ...(search && { playListName: { $regex: search, $options: 'i' } })
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     playListName: 1,
//                     playlist_img: { $concat: [baseURL, 'profile/', '$playlist_img'] },
//                     totalPlayCount: { $sum: '$songs.playCount' }
//                 }
//             },
//             {
//                 $match: {
//                     totalPlayCount: { $gt: 0 }
//                 }
//             },
//             {
//                 $limit: 3
//             },
//             {
//                 $sort: { totalPlayCount: -1 }
//             },
//             {
//                 $limit: 10
//             },
//             // if i don't want to show playcount in output than i using group 
//             {
//                 $project: {
//                     playListName: 1,
//                     playlist_img: 1
//                 }
//             }
//         ])
//             .limit(3)
//         console.log('🤷‍♀️', popularPlaylists);

//         deferred.resolve(popularPlaylists);

//     } catch (error) {
//         console.log('userController.popular-', error);
//         deferred.reject(error);
//     }
//     return deferred.promise;
// }

userController.popular = async (req, res) => {
    const deferred = Q.defer();
    const { } = req.body;
    try {
        const search = req.query.search || '';

        const popularSongs = await songMaster.aggregate([
            {
                $match: {
                    deleted_at: null,
                    playCount: { $gt: 1 }, // Filter for songs with playCount greater than 4
                    ...(search && { songName: { $regex: new RegExp(search, 'i') } })
                }
            },
            {
                $unwind: '$playList_id'
            },
            {
                $lookup: {
                    from: 'playlist_masters', 
                    localField: 'playList_id', 
                    foreignField: '_id',
                    as: 'playlistDetails'
                }
            },
            // {
            //     $unwind: '$playlistDetails'
            // },
            { $sort: { playCount: 1 } },
            {
                $limit: 10
            }
        ]);

        console.log('😀', popularSongs);

        if (!popularSongs || popularSongs.length === 0) {
            deferred.reject("There are no popular songs yet.");
            return deferred.promise;
        }

        const songs = popularSongs.map(song => ({
            _id: song._id,
            songName: song.songName,
            playListName: song.playlistDetails.playListName,
            playlist_img: baseURL + 'profile/' + song.playlistDetails.playlist_img
        }));

        deferred.resolve(songs);

        // const popularSongs = await songMaster.find(
        //     {
        //         deleted_at: null,
        //         playCount: { $gt: 4 },
        //         ...(search && { songName: { $regex: new RegExp(search, 'i') } })
        //     }
        // ).select('songName songFile').limit(10).sort({ playCount: -1 })
        // if (!popularSongs) {
        //     deferred.reject("there is no popular songs yet.");
        //     return deferred.promise;
        // }
        // const songs = popularSongs.map(song => ({
        //     _id: song._id,
        //     songName: song.songName,
        //     songFile: baseURL + 'profile/' + song.songFile
        // }))
        // deferred.resolve(songs);
    } catch (error) {
        console.log('userController.popular-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.home = async (req, res) => {
    const deferred = Q.defer();
    const { side, search, type } = req.query;
    try {
        let response = {};
        if (type == 'true') {
            if (side == 'recently' || side == 'popular') {
                if (side == 'recently') {
                    const recently = await userController.allSongs(req, res);
                    response.recently = recently;
                } else if (side == 'popular') {
                    const popular = await userController.allSongs(req, res);
                    response.popular = popular;
                }
            } else {
                deferred.reject("Your side is wrong please add properly");
            }

        } else {
            const recentlySongs = await userController.recently(req, res)
            console.log('recentlySing', recentlySongs)
            const popularSongs = await userController.popular(req, res);
            console.log('popular', popularSongs);

            response.recently = recentlySongs;
            response.popular = popularSongs;
        }
        // console.log('😂', response)
        deferred.resolve(response);
    } catch (error) {
        console.log('userController.home-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.allSongs = async (req, res) => {
    const deferred = Q.defer();
    const { search, side } = req.query;
    try {
        const search = req.query.search || '';
        let songs;

        if (side == 'recently') {
            songs = await songMaster.find({
                deleted_at: null,
                createdAt: { $gte: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
                ...(search && { songName: { $regex: new RegExp(search, 'i') } })
            })
                .select('songName songFile')
                .sort({ createdAt: -1 })

            songs = songs.map(song => ({
                _id: song._id,
                songName: song.songName,
                songFile: baseURL + 'profile/' + song.songFile
            }))

        } else if (side == 'popular') {
            songs = await songMaster.find(
                {
                    deleted_at: null,
                    playCount: { $gt: 4 },
                    ...(search && { songName: { $regex: new RegExp(search, 'i') } })
                }
            ).select('songName songFile').limit(10).sort({ playCount: -1 })
            if (!songs) {
                deferred.reject("there is no popular songs yet.");
                return deferred.promise;
            }
            songs = songs.map(song => ({
                _id: song._id,
                songName: song.songName,
                songFile: baseURL + 'profile/' + song.songFile
            }))
        } else {
            deferred.reject("Invalid side parameters")
        }

        if (songs == '') {
            deferred.reject('No playList found.');
        }

        if (search) {
            songs = songs.filter(song => song.songName.match(new RegExp(search, 'i')));
        }

        deferred.resolve(songs);
    } catch (error) {
        console.log('userController.allSongs-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.addFavourite = async (req, res) => {
    const deferred = Q.defer();
    const { song_id } = req.body;
    try {
        const user = req.user;
        const existingFavourite = await favouriteMaster.findOne({ user_id: user._id, song_id: song_id });
        // console.log('😀',existingFavourite)
        if (existingFavourite) {
            await favouriteMaster.deleteOne({ _id: existingFavourite._id });
            deferred.reject("Unfavourite Successfull.");
        } else {
            const addFav = new favouriteMaster();
            addFav.user_id = user._id;
            addFav.song_id = song_id;
            await addFav.save();
            deferred.resolve(addFav);
        }
    } catch (error) {
        console.log('usercontroller.addFavourite-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.addToCart = async (req, res) => {
    const deferred = Q.defer();
    const { song_id } = req.body;
    try {
        let user = req.user;
        let existCart = await cartMaster.findOne({ song_id: song_id });
        console.log(existCart);
        if (existCart) {
            deferred.reject("You already added this song in cart.")
        } else {
            let addCart = new cartMaster();
            addCart.user_id = user._id;
            addCart.song_id = song_id;
            await addCart.save();
            deferred.resolve(addCart);
        }
    } catch (error) {
        console.log('userController.addToCart-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.recentlyPlaylistSongs = async (req, res) => {
    const deferred = Q.defer();
    const { playList_id, song_id } = req.body;
    try {
        const user = req.user; // Fetch the user info
        console.log(user);
        let search = req.query.search || '';

        let playlist = await playListMaster.findById(playList_id);
        if (!playlist) {
            deferred.reject("We are not able to find this playlist.");
            return deferred.promise;
        }

        let pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playList_id)
                }
            },
            {
                $lookup: {
                    from: 'song_masters',
                    localField: '_id',
                    foreignField: 'playList_id',
                    as: 'songs'
                }
            },
            { $unwind: '$songs' },
            {
                $match: {
                    ...(search && { 'songs.songName': { $regex: new RegExp(search, 'i') } })
                }
            },
            {
                $lookup: {
                    from: 'favourite_masters',
                    let: { songId: '$songs._id', userId: new mongoose.Types.ObjectId(user._id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$song_id', '$$songId'] },
                                        { $eq: ['$user_id', '$$userId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'isFavorite'
                }
            },
            {
                $addFields: {
                    'songs.favourite': { $cond: { if: { $gt: [{ $size: '$isFavorite' }, 0] }, then: 1, else: 0 } }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    songs: { $push: '$songs' }
                }
            }
        ];


        let recentlyResponse = await playListMaster.aggregate(pipeline);
        console.log(recentlyResponse)
        if (recentlyResponse == '') {
            deferred.reject("We are not able to find any songs in this playlist.");
            return deferred.promise;
        }

        if (song_id) {
            const songExists = recentlyResponse[0].songs.some(song => song._id.equals(song_id));
            if (!songExists) {
                deferred.reject("This song does not exist in the playlist.");
                return deferred.promise;
            }

            await songMaster.findByIdAndUpdate(song_id, { $inc: { playCount: 1 } });
        }

        // if (addToCart == 'true' && user && song_id) {
        //     try {
        //         await userController.addToCart({ body: { song_id }, user });
        //     } catch (cartError) {
        //         deferred.reject(cartError);
        //         return deferred.promise;
        //     }
        // }

        if (req.query.myCart == 'true') {
            if (!req.body.song_id) {
                deferred.reject("song_id must be required if you want to add this song in cart.");
                return deferred.promise;
            }
            let existCart = await cartMaster.findOne({ user_id: user._id, song_id: song_id });
            if (existCart) {
                deferred.reject("You already added this song in cart.");
                return deferred.promise;
            }
            let addCart = new cartMaster();
            addCart.song_id = song_id;
            addCart.user_id = user._id;
            await addCart.save();
            deferred.resolve(addCart);
            // return deferred.promise;
        }


        const songs = recentlyResponse[0].songs.map(song => ({
            _id: song._id,
            songName: song.songName,
            songFile: baseURL + 'profile/' + song.songFile,
            favourite: song.favourite // 1 if favorite, 0 if not
        }));
        console.log('👍', songs)
        deferred.resolve(songs);
    } catch (error) {
        console.error("userController.recentlyPlaylistSongs-", error);
        deferred.reject(error);
    }
    return deferred.promise;
};

userController.Songs = async (req, res) => {
    const deferred = Q.defer();
    const { } = req.body;
    try {

    } catch (error) {
        console.log('usercontroller.Songs-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.popularPlaylistSongs = async (req, res) => {
    const deferred = Q.defer();
    const { song_id, popularList_id, addToCart } = req.body;
    try {
        const user = req.user;
        let search = req.query.search || '';

        const popularexist = await playListMaster.findById(popularList_id);
        if (!popularexist) {
            deferred.reject("We are not able to find this playlist.");
            return deferred.promise;
        }
        let pipeline = [
            {
                $match: {
                    playList_id: new mongoose.Types.ObjectId(popularList_id),
                    ...(search && { songName: { $regex: new RegExp(search, 'i') } })
                }
            },
            {
                $lookup: {
                    from: 'favourite_masters',
                    let: { songId: '$_id', userId: new mongoose.Types.ObjectId(user._id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$song_id', '$$songId'] },
                                        { $eq: ['$user_id', '$$userId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'isFavorite'
                }
            },
            {
                $addFields: {
                    favourite: { $cond: { if: { $gt: [{ $size: '$isFavorite' }, 0] }, then: 1, else: 0 } }
                }
            },
            {
                $project: {
                    _id: 1,
                    songName: 1,
                    songFile: { $concat: [baseURL, 'profile/', '$songFile'] },
                    favourite: 1
                }
            }
        ];

        let showALLsongs = await songMaster.aggregate(pipeline);

        if (showALLsongs == '') {
            // if (!showALLsongs || showALLsongs.length === 0) {
            deferred.reject("No songs found in this playlist.");
            return deferred.promise;
        }

        if (song_id) {
            const songExists = showALLsongs.some(song => song._id.equals(song_id));
            if (!songExists) {
                deferred.reject("This song does not exist in the playlist.");
                return deferred.promise;
            }
            await songMaster.findByIdAndUpdate(song_id, { $inc: { playCount: 1 } });
        }

        // if (addToCart == 'true' && user && song_id) {
        //     try {
        //         await userController.addToCart(req.body);
        //         // await userController.addToCart({ body: { song_id }, user });
        //     } catch (cartError) {
        //         deferred.reject(cartError);
        //         return deferred.promise;
        //     }
        // }

        if (req.query.myCart == 'true') {
            if (!req.body.song_id) {
                deferred.reject("song_id must be required if want to add this song in cart.");
                return deferred.promise;
            }
            let existCart = await cartMaster.findOne({ user_id: user._id, song_id: song_id });
            if (existCart) {
                deferred.reject("You already added this song in cart.");
                return deferred.promise;
            }
            let addCart = new cartMaster();
            addCart.song_id = song_id;
            addCart.user_id = user._id;
            await addCart.save();
            deferred.resolve(addCart);
            return deferred.promise;
        }


        const songs = showALLsongs.map(song => ({
            _id: song._id,
            songName: song.songName,
            songFile: song.songFile,
            favourite: song.favourite // 1 if favorite, 0 if not
        }));

        deferred.resolve(songs);
    } catch (error) {
        console.error("userController.popularPlaylistSongs -", error);
        deferred.reject(error);
    }
    return deferred.promise;
};

userController.searchByArtist = async (req, res) => {
    const deferred = Q.defer();
    const { alphabet } = req.query; // Assuming 'alphabet' is the query parameter for filtering by alphabet

    try {
        let search = req.query.search || '';
        let filter = { deleted_at: null };

        if (alphabet && /^[a-zA-Z]$/.test(alphabet)) {
            filter.artistName = { $regex: new RegExp(`^${alphabet}`, 'i') };// ^ means start thai che ${alphabet} means if user click b than it means ^b and they show artist which is start from b letter
        }

        if (search) {
            filter.artistName = { ...filter.artistName, $regex: new RegExp(search, 'i') };
        }

        const artistLists = await artistMaster.find(filter).select('artistName artistImg');

        if (artistLists == '') {
            const message = alphabet
                ? `We are not able to find any artists that start with '${alphabet}'.`
                : search
                    ? `We are not able to find any artists matching '${search}'.`
                    : "We are not able to find any artists.";

            deferred.reject(message);
            return deferred.promise;
        }
        deferred.resolve(artistLists);
    } catch (error) {
        console.log('userController.searchByArtist -', error);
        deferred.reject(error);
    }
    return deferred.promise;
};

userController.searchByArtistSongs = async (req, res) => {
    const deferred = Q.defer();
    const { artist_id, song_id, addToCart } = req.body;
    try {
        console.log(req.body);
        let user = req.user;
        console.log(user);
        if (!user) {
            deferred.reject('invalid_user_id');
            return deferred.promise;
        }
        const search = req.query.search || '';
        const artistList = await artistMaster.findById(artist_id);
        if (!artistList) {
            deferred.reject('We are not able to find this playList.');
            return deferred.promise;
        }

        const pipeline = [
            {
                $match: {
                    artist_id: new mongoose.Types.ObjectId(artist_id),
                    ...(search && { songName: { $regex: new RegExp(search, 'i') } })
                }
            },
            {
                $lookup: {
                    from: 'favourite_masters',
                    let: { songId: '$_id', userId: new mongoose.Types.ObjectId(user._id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$song_id', '$$songId'] },
                                        { $eq: ['$user_id', '$$userId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'isFavourite'
                }
            },
            {
                $addFields: {
                    favourite: { $cond: { if: { $gt: [{ $size: '$isFavourite' }, 0] }, then: 1, else: 0 } }
                }
            },
            {
                $project: {
                    _id: 1,
                    songName: 1,
                    songFile: { $concat: [baseURL, 'profile/', '$songFile'] },
                    favourite: 1
                }
            }
        ];

        let showALLsongs = await songMaster.aggregate(pipeline);
        if (showALLsongs == '') {
            deferred.reject('No song found in this playList.')
            return deferred.promise;
        }

        if (song_id) {
            let songExist = showALLsongs.some(song => song._id.equals(song_id));
            if (!songExist) {
                deferred.reject("These song deosn't exist in this playList.");
                return deferred.promise;
            }
            await songMaster.findByIdAndUpdate(song_id, { $inc: { playCount: 1 } })
        }

        if (req.query.myCart == 'true') {
            if (!req.body.song_id) {
                deferred.reject("song_id must be required if want to add this song in cart.");
                return deferred.promise;
            }
            let existCart = await cartMaster.findOne({ user_id: user._id, song_id: song_id });
            if (existCart) {
                deferred.reject("You already added this song in cart.");
                return deferred.promise;
            }
            let addCart = new cartMaster();
            addCart.song_id = song_id;
            addCart.user_id = user._id;
            await addCart.save();
            deferred.resolve(addCart);
            return deferred.promise;
        }

        const songs = showALLsongs.map(song => ({
            _id: song._id,
            songName: song.songName,
            songFile: song.songFile,
            favourite: song.favourite
        }));

        deferred.resolve(songs);
    } catch (error) {
        console.log('usercontroller.searchByArtistSongs-', error);
        deferred.reject(error);
    }
    return deferred.promise;
};

userController.gospelShowallSongs = async (req, res) => {
    const deferred = Q.defer();
    const { song_id } = req.body;
    try {
        let user = req.user;
        let search = req.query.search || '';
        if (req.query.side == 'gospelAllSongs') {
            // let showALLGospelSongs = await songMaster.find({ category: 'Gospel Song', ...(search && { songName: { $regex: new RegExp(search, 'i') } }) })
            // if (!showALLGospelSongs) {
            //     deferred.reject("We are not able to find any songs");
            //     return deferred.promise;
            // };
            // let songList = showALLGospelSongs.map(song => ({
            //     _id: song._id,
            //     songName: song.songName,
            //     songFile: baseURL + 'profile/' + song.songFile
            // }))
            let pipeline = [
                {
                    $match: {
                        category: 'Gospel Song',
                        ...(search && { songName: { $regex: new RegExp(search, 'i') } })
                    }
                },
                {
                    $lookup: {
                        from: 'favourite_masters',
                        // let: { songId: '$_id' },
                        let: { songId: '$_id', userId: new mongoose.Types.ObjectId(req.user._id) },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$song_id', '$$songId'] },
                                            { $eq: ['$user_id', '$$userId'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'isFavourite'
                    }
                },
                {
                    $addFields: {
                        favourite: { $cond: { if: { $gt: [{ $size: '$isFavourite' }, 0] }, then: 1, else: 0 } }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        songName: 1,
                        songFile: { $concat: [baseURL, 'profile/', '$songFile'] },
                        favourite: 1
                    }
                }
            ];

            let showALLGospelSongs = await songMaster.aggregate(pipeline);

            if (!showALLGospelSongs) {
                deferred.reject("We are not able to find any songs");
                return deferred.promise;
            }

            if (song_id) {
                const songExists = showALLGospelSongs.some(song => song._id.equals(song_id));
                if (!songExists) {
                    deferred.reject("This song does not exist in the playlist.");
                    return deferred.promise;
                }
                await songMaster.findByIdAndUpdate(song_id, { $inc: { playCount: 1 } });
            }

            if (req.query.myCart == 'true') {
                if (!req.body.song_id) {
                    deferred.reject("song_id must be required if want to add this song in cart.");
                    return deferred.promise;
                }
                let existCart = await cartMaster.findOne({ user_id: user._id, song_id: song_id });
                if (existCart) {
                    deferred.reject("You already added this song in cart.");
                    return deferred.promise;
                }
                let addCart = new cartMaster();
                addCart.song_id = song_id;
                addCart.user_id = user._id;
                await addCart.save();
                deferred.resolve(addCart);
                return deferred.promise;
            }

            deferred.resolve(showALLGospelSongs);
        } else {
            deferred.reject("Please enter correct gospel's value.");
        }
    } catch (error) {
        console.log('userController.gospelShowallSongs-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.gospelSongs = async (req, res) => {
    const deferred = Q.defer();
    const { side, type } = req.query;
    try {
        let response = {};
        if ((side == 'gospelAllSongs' || side == 'recently' || side == 'popular') && type !== 'true') {
            deferred.reject('Please enter first type.');
            return deferred.promise;
        }
        if (type == 'true') {
            if (side == 'gospelAllSongs' || side == 'recently' || side == 'popular') {
                if (side == 'gospelAllSongs' || req.query.myCart == 'true') {
                    response = await userController.gospelShowallSongs(req, res);
                    // let gospel = await userController.gospelShowallSongs(req, res);
                    // response.gospelAllSongs = gospel;
                } else if (side == 'recently') {
                    let recently = await userController.recently(req, res);
                    response.recently = recently;
                } else if (side == 'popular') {
                    let popular = await userController.popular(req, res);
                    response.popular = popular;
                }
            } else {
                deferred.reject("You added value in side is wrong please enter correct side.")
            }
        } else {
            let recently = await userController.recently(req, res);
            let popular = await userController.popular(req, res);

            response.recently = recently;
            response.popular = popular;
        }

        deferred.resolve(response);
    } catch (error) {
        console.log('userController.gospelSongs-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.contemporaryShowALLSongs = async (req, res) => {
    const deferred = Q.defer();
    const { song_id } = req.body;
    try {
        let user = req.user;
        if (!user) {
            deferred.reject("invalid_user_id");
            return deferred.promise;
        }
        const search = req.query.search || '';
        if (req.query.side == 'contemporaryAllSongs') {
            let pipeline = [
                {
                    $match: {
                        category: 'Contemporary Christian songs',
                        ...(search && { songName: { $regex: new RegExp(search, 'i') } })
                    }
                },
                {
                    $lookup: {
                        from: 'favourite_masters',
                        let: { songId: '$_id', userId: new mongoose.Types.ObjectId(user._id) },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$song_id', '$$songId'] },
                                            { $eq: ['$user_id', '$$userId'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'isFavourite'
                    }
                },
                {
                    $addFields: {
                        favourite: { $cond: { if: { $gt: [{ $size: '$isFavourite' }, 0] }, then: 1, else: 0 } }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        songName: 1,
                        songFile: { $concat: [baseURL, 'profile/', '$songFile'] },
                        favourite: 1
                    }
                }
            ];

            let contemporaryAllSongs = await songMaster.aggregate(pipeline);




            console.log(contemporaryAllSongs)


            if (contemporaryAllSongs == '') {
                deferred.reject("We are not able to find any songs.");
                return deferred.promise;
            }

            if (song_id) {
                let existSong = contemporaryAllSongs.some(song => song._id.equals(song_id));
                if (!existSong) {
                    deferred.reject("This songs is not available.");
                    return deferred.promise;
                }
                await songMaster.findById(song_id, { $inc: { playCount: 1 } })
            }

            if (req.query.myCart == 'true') {
                let existCart = await cartMaster.findOne({ user_id: user._id, song_id: song_id })
                if (existCart) {
                    deferred.reject("You already added this song in cart");
                    return deferred.promise;
                }
                const addCart = new cartMaster();
                addCart.user_id = user._id;
                addCart.song_id = song_id;
                await addCart.save();
                deferred.resolve(addCart);
                return deferred.promise;
            }

            deferred.resolve(contemporaryAllSongs);
            console.log("contenporaryrrr", contemporaryAllSongs);
        } else {
            deferred.reject("Please enter correct Contemporary Christian songs's value.");
        }
    } catch (error) {
        console.log('userController.contemporaryShowALLSongs-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.contemporarySongs = async (req, res) => {
    const deferred = Q.defer();
    const { side, type } = req.query;
    try {
        let response = {};
        if ((side == 'contemporaryAllSongs' || side == 'recently' || side == 'popular') && type !== 'true') {
            deferred.reject('Please enter first type.');
            return deferred.promise;
        }
        if (type == 'true') {
            if (side == 'contemporaryAllSongs' || side == 'recently' || side == 'popular') {
                if (side == 'contemporaryAllSongs' || req.query.myCart == 'true') {
                    response = await userController.contemporaryShowALLSongs(req, res);
                    // let gospel = await userController.gospelShowallSongs(req, res);
                    // response.gospelAllSongs = gospel;
                } else if (side == 'recently') {
                    let recently = await userController.recently(req, res);
                    response.recently = recently;
                } else if (side == 'popular') {
                    let popular = await userController.popular(req, res);
                    response.popular = popular;
                }
            } else {
                deferred.reject("You added value in side is wrong please enter correct side.")
            }
        } else {
            let recently = await userController.recently(req, res);
            let popular = await userController.popular(req, res);

            response.recently = recently;
            response.popular = popular;
        }

        deferred.resolve(response);
    } catch (error) {
        console.log('userController.contemporarySongs-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.hymnsShowAllSongs = async (req, res) => {
    const deferred = Q.defer();
    const { song_id } = req.body;
    try {
        let user = req.user;
        if (!user) {
            deferred.reject("invalid_user_id");
            return deferred.promise;
        }
        const search = req.query.search || '';
        if (req.query.side == 'hymnsSongs') {
            let pipeline = [
                {
                    $match: {
                        category: 'Hymns',
                        ...(search && { songName: { $regex: new RegExp(search, 'i') } })
                    }
                },
                {
                    $lookup: {
                        from: 'favourite_masters',
                        let: { songId: '$_id', userId: new mongoose.Types.ObjectId(user._id) },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$song_id', '$$songId'] },
                                            { $eq: ['$user_id', '$$userId'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'isFavourite'
                    }
                },
                {
                    $addFields: {
                        favourite: { $cond: { if: { $gt: [{ $size: 'isFavourite' }, 0] }, then: 1, else: 0 } }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        songName: 1,
                        songFile: { $concat: [baseURL, 'profile/', '$songFile'] },
                        favourite: 1
                    }
                }
            ];

            let hymnsAllSongs = await songMaster.aggregate(pipeline);
            if (hymnsAllSongs == '') {
                deferred.reject("We are not able to find any songs.");
                return deferred.promise;
            }

            if (song_id) {
                let existSong = hymnsAllSongs.some(song => song._id.equals(song_id));
                if (!existSong) {
                    deferred.reject("This songs is not available.");
                    return deferred.promise;
                }
                await songMaster.findById(song_id, { $inc: { playCount: 1 } })
            }

            if (req.query.myCart == 'true') {
                let existCart = await cartMaster.findOne({ user_id: user._id, song_id: song_id })
                if (existCart) {
                    deferred.reject("You already added this song in cart");
                    return deferred.promise;
                }
                const addCart = new cartMaster();
                addCart.user_id = user._id;
                addCart.song_id = song_id;
                await addCart.save();
                deferred.resolve(addCart);
                return deferred.promise;
            }

            deferred.resolve(showALLGospelSongs);
        } else {
            deferred.reject("Please enter correct Hymns's value.");
        }
    } catch (error) {
        console.log('userController.hymnsShowALLSongs-', error);
        deferred.reject(error);
    }
    return deferred.promis;
}

userController.hymnsSongs = async (req, res) => {
    const deferred = Q.defer();
    const { side, type } = req.query;
    try {
        let response = {};
        if ((side == 'hymnsAllSongs' || side == 'recently' || side == 'popular') && type !== 'true') {
            deferred.reject('Please enter first type.');
            return deferred.promise;
        }
        if (type == 'true') {
            if (side == 'hymnsAllSongs' || side == 'recently' || side == 'popular') {
                if (side == 'hymnsAllSongs' || req.query.myCart == 'true') {
                    response = await userController.hymnsShowAllSongs(req, res);
                    // let gospel = await userController.gospelShowallSongs(req, res);
                    // response.gospelAllSongs = gospel;
                } else if (side == 'recently') {
                    let recently = await userController.recently(req, res);
                    response.recently = recently;
                } else if (side == 'popular') {
                    let popular = await userController.popular(req, res);
                    response.popular = popular;
                }
            } else {
                deferred.reject("You added value in side is wrong please enter correct side.")
            }
        } else {
            let recently = await userController.recently(req, res);
            let popular = await userController.popular(req, res);

            response.recently = recently;
            response.popular = popular;
        }

        deferred.resolve(response);
    } catch (error) {
        console.log('userController.hymnsSongs-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.updateProfile = async (req, res) => {
    const deferred = Q.defer();
    const { name, phone, address, oldPassword, newPassword, confirmPassword } = req.body;
    try {
        let user = req.user;
        if (!user) {
            deferred.reject('invalid_user_id');
            return deferred.promise;
        }
        let update = await userMaster.findByIdAndUpdate(user._id, { name: name, phone: phone, address: address }, { new: true });
        if (req.query.password == 'true') {
            if (user.password != oldPassword) {
                deferred.reject('check_old_password');
                if (user.password == newPassword) {
                    deferred.reject('check_password');
                    if (newPassword != confirmPassword) {
                        deferred.reject('Your confirm password is not equal to new password.');
                    }
                }
            }
            let updatePassword = await userMaster.findByIdAndUpdate(user._id, { password: confirmPassword }, { new: true });
            deferred.resolve(updatePassword);
            return deferred.promise;
        }
        deferred.resolve(update);
    } catch (error) {
        console.log('userController.updateProfile-')
    }
    return deferred.promise;
}





function makeid(length) {
    let result = ''
    let characters = '123456789'
    let characterLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characterLength))
    }
    return result
}

module.exports = userController;