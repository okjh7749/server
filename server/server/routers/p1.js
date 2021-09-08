module.exports = function (app) {
    var express = require('express');
    var route = express.Router();

    route.get('/r1', function (req, res) {
        res.send('hhihihihih')
    });

    return route;
};