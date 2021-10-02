module.exports = function (app) {
    var express = require('express');
    var route = express.Router();

    var bodyParser = require('body-parser');
    route.use(bodyParser.json());
    route.use(bodyParser.urlencoded({ extended: true }));
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: "ec2-3-36-182-213.ap-northeast-2.compute.amazonaws.com",
        user: "jh",
        database: "server",
        password: "ckddlfwnd3349!",
        port: 3306
    });
    

    route.get('/sd', function (req, res) {
        console.log(req.sessionID);
        res.json({
            "session" : req.session
        });
        // 삽입을 수행하는 sql문.
        
        
    });

   
    return route;
};