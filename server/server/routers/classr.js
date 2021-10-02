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
    const pool = mysql.createPool({
        host: "ec2-3-36-182-213.ap-northeast-2.compute.amazonaws.com",
        user: "jh",
        database: "server",
        password: "ckddlfwnd3349!",
        port: 3306
    });




    route.post('/addclass', async (req, res) => {
        var resultCode = 200;
        var message = 'fail';
        const connection = await pool.getConnection(async conn => conn);
        await connection.beginTransaction();
        console.log(req.sessionID);
        console.log(req.body);

        var title = req.body.title;
        var content = req.body.content;
        var writer = "writer"//session.getAttribute("userID");
        var addtime = req.body.addtime;
        var reservation_date = moment().add(addtime, 'h').format('YYYY-MM-DD HH:mm:ss');
        var Latitue = req.body.Latitue;
        var Longitude = req.body.Longitude;
        var classno;
        var member = writer;
        try {
            var sql = 'INSERT INTO class_reservation (title, content,writer,reservation_date,Latitue,Longitude) VALUES (?, ?, ?, ?,?,?)';
            var params = [title, content, writer, reservation_date, Latitue, Longitude];
            let result = await connection.execute(sql, params);
            if (result[0].affectedRows == 0) {
                throw new Error("cantinsert class");
                resultCode = 404;
                message = 'write fail';
                console.log(message);
            } else {
                resultCode = 200;
                message = 'post complate.';
                var sql1 = 'SELECT LAST_INSERT_ID() as lid';
                //추가된 포스트의 고유 id 를 가져와 저장
                let result1 = await connection.execute(sql1);
                if (result1[0].affectedRows == 0) {
                    throw new Error("cantinsert class");
                    resultCode = 404;
                    message = 'write fail';
                    console.log(message);
                } else {
                    classno = result1[0][0].lid;
                }
                var sql2 = 'INSERT INTO class_member(classno,member) VALUES (?,?)';
                var params2 = [classno, member];
                let result2 = await connection.execute(sql2, params2);
                if (result2[0].affectedRows == 0) {
                    throw new Error("cantinsert class_member");
                    resultCode = 404;
                    message = 'write fail';
                    console.log(message);
                } else {
                    resultCode = 200;
                    message = 'write complate';
                    console.log(message);
                }

            }
        }
        catch (err) {
            await connection.rollback();
            res.json({
                'code': resultCode,
                'message': "등록 실패"
            });
            throw err;
        } finally {
            connection.release();
        }
        res.json({
            'code': resultCode,
            'message': message
        });


    });




    route.post('/joinclass', async (req, res) => {
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

        var title = req.body.title;
        var content = req.body.content;
        var writer = "writer"//session.getAttribute("userID");
        var addtime = req.body.addtime;
        var reservation_date = moment().add(addtime, 'h').format('YYYY-MM-DD HH:mm:ss');
        var Latitue = req.body.Latitue;
        var Longitude = req.body.Longitude;
        var classno;
        var meber = writer;
        try {
            var sql = 'INSERT INTO class_reservation (title, content,writer,reservation_date,Latitue,Longitude) VALUES (?, ?, ?, ?,?,?)';
            var params = [title, content, writer, reservation_date, Latitue, Longitude];
            let result = await connection.execute(sql, params);
            if (result[0].affectedRows == 0) {
                throw new Error("cantinsert class");
                resultCode = 404;
                message = 'write fail';
                console.log(message);
            } else {
                resultCode = 200;
                message = 'post complate.';
                var sql1 = 'SELECT LAST_INSERT_ID() as lid';
                //추가된 포스트의 고유 id 를 가져와 저장
                connection.query(sql1, function (err, result) {
                    classno = result[0].lid;
                });
                var sql2 = 'INSERT INTO class_member(classno,member) VALUES (?,?)';
                var params2 = [classno, member];
                let result2 = await connection.execute(sql2, params2);
                if (result[0].affectedRows == 0) {
                    throw new Error("cantinsert class_member");
                    resultCode = 404;
                    message = 'write fail';
                    console.log(message);
                } else {
                    resultCode = 200;
                    message = 'write complate';
                    console.log(message);
                }

            }
        }
        catch (err) {
            await connection.rollback();
            res.json({
                'code': resultCode,
                'message': "등록 실패"
            });
            throw err;
        } finally {
            connection.release();
        }
        res.json({
            'code': resultCode,
            'message': message
        });


    });
    return route;
};