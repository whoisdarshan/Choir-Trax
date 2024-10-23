const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminMaster = Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
    deleted_at: { type: Date, default: null }
}, {
    versionKey: false,
    timestamps: true
});

adminMaster.static = {
    /**
     * 
     * get data
     * @param {*} filter
     * @returns
     */

    async get(id) {
        return this.findOne(id).exec();
    },
    /**
     * 
     * list of data
     * @param {*} filter
     * @returns
     */

    async list(filter = {}) {
        return this.find(filter).exec();
    }

};

adminMaster.methods.toJSON = function () {
    var obj = this.toObject();
    var objKeys = Object.keys(obj);
    objKeys.forEach(key => {
        if (obj[key] == null) {
            obj[key] = ''
        }
    })
    return obj
}


module.exports = mongoose.model('admin_masters', adminMaster);