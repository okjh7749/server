module.exports = function (app) {
    var express = require('express');
    var route = express.Router();
    var bodyParser = require('body-parser');
    var moment = require('moment');

    require('moment-timezone');
    moment.tz.setDefault("Asia/Seoul");
    var date = moment().format('YYYY-MM-DD HH:mm:ss');
    var async = require("async");
    route.use(bodyParser.json());
    route.use(bodyParser.urlencoded({ extended: true }));
    var mysql = require('mysql2/promise');
    var session = require('express-session')
    var MySQLStore = require("express-mysql-session")(session);
    const pool = mysql.createPool({
        host: "ec2-3-36-182-213.ap-northeast-2.compute.amazonaws.com",
        user: "jh",
        database: "server",
        password: "ckddlfwnd3349!",
        port: 3306
    });


    route.get('/lookuppost/:postno', async (req, res) => {
        var resultCode = 200;
        var message = 'fail';
        const connection = await pool.getConnection(async conn => conn);
        var sessionStore = new MySQLStore({} /* session store options */, connection);
        app.use(
            session({
                key: "session_cookie_name",
                secret: "session_cookie_secret",
                store: sessionStore,
                resave: false,
                saveUninitialized: false,
            })
        );
        await connection.beginTransaction();
        console.log(req.body);
        var postno = req.params.postno;
        /*
        var matches = [];
        var i = 0;
        resultCode = 404;
        message = 'fail';
        tags = tags.split(/(#[^#\s]+)/g).map(v => {
            if (v.match('#')) {
                matches[i++] = v;
            }
            return v;
        });
        */
        try {

            console.log("start");
            //게시글 등록
            var sql = 'SELECT * FROM Post WHERE postno = ?';
            var params = [postno];
            let result = await connection.execute(sql, params);
            if (result[0].affectedRows == 0) {
                throw new Error("affectedRows is zero where post");
                resultCode = 404;
                message = 'write fail';
                console.log(message);
                
            }
            else {
                var title = result[0][0].title;
                var content = result[0][0].content;
                var writer = result[0][0].writer;
                var write_date = result[0][0].write_date;
                var matches = [];
                var i = 0;
                resultCode = 404;
                message = 'fail';
                var tags = content.split(/(#[^#\s]+)/g).map(v => {
                    if (v.match('#')) {
                        matches[i++] = v;
                    }
                    return v;
                });
            }
        } catch (err) {
            await connection.rollback();
            res.json({
                'code': resultCode,
                'message': message
            });
            throw err;

        } finally {
            connection.release();
        }
        res.json({
            'title': title,
            'content': content,
            'writer': writer,
            'write_date': write_date,
            file: null, files: req.files
        });
    });

    return route;
};