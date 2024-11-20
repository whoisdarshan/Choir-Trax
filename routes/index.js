const express = require('express');
const mainRouter = express.Router();

var admin = require('./admin.routes');
mainRouter.use('/admin', admin);

var user = require('./user.routes');
mainRouter.use('/user', user);


module.exports = function (app) {
    app.use('/api/', mainRouter);
}