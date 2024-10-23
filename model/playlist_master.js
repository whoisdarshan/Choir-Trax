const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playListMaster = Schema({
    playListName: { type: String },
    playlist_img: { type: String },
    deleted_at: { type: Date, default: null }
}, {
    versionKey: false,
    timestamps: true
});

playListMaster.static = {
    /**
     * 
     * get data
     * @param {*} filter
     * @returns
     */
    async get(id) {
        return this.findOne(id)
    },

    /**
     * 
     * list of data
     * @param {*} filter
     * @params
     */
    async list(filter = {}) {
        return this.find(filter);
    }
}

let publicPath = APP_URL + '/public/'

playListMaster.methods.toJSON = function () {
    var obj = this.toObject()
    var objKeys = Object.keys(obj)
    objKeys.forEach(key => {
        if (obj[key] == null) {
            obj[key] = ''
        }
    })

    if (obj.playlist_img && obj.playlist_img !== '') {
        obj.playlist_img = publicPath + 'profile/' + obj.playlist_img
    }
    return obj
}

module.exports = mongoose.model('playList_master', playListMaster);