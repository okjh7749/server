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
    var connection = mysql.createConnection({
        host: "ec2-3-36-182-213.ap-northeast-2.compute.amazonaws.com",
        user: "jh",
        database: "server",
        password: "ckddlfwnd3349!",
        port: 3306
    });
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

    route.post('/addpost', function (req, res) {
        console.log(req.body);
        var matches = [];
        var i = 0;
        var title = req.body.title;
        var writer = "writer"//session.getAttribute("userID");
        var content = req.body.content;
        var write_date = date;
        var tags = req.body.content;
        var postno;
        var tagno;
        tags = tags.split(/(#[^#\s]+)/g).map(v => {
            if (v.match('#')) {
                matches[i++] = v;
            }
            return v;
        });
        var sql = 'INSERT INTO Post (title, content,writer,write_date) VALUES (?, ?, ?, ?)';
        var params = [title, content, writer, write_date];
        connection.query(sql, params, function (err, result) {
            var resultCode = 404;
            var message = '글쓰기 에러가 발생했습니다';
            if (err) {
                console.log(err);
            } else {
                resultCode = 200;
                message = 'post complate.';
                var sql1 = 'SELECT LAST_INSERT_ID() as lid';
                //추가된 포스트의 고유 id 를 가져와 저장
                connection.query(sql1, function (err, result) {
                    postno = result[0].lid;
                });
                var size = matches.length;
                for (var i = 0; i < size; i++) {
                    (function (i) {
                        if (i > 2)
                            return 0;
                        var tag = matches[i];
                        //현재 존재하는 태그인지 확인하는 sql문
                        var sql2 = 'SELECT COUNT(*) as cnt FROM Tag WHERE tag_name = ?';
                        var params2 = [tag];
                        connection.query(sql2, params2, function (err, result) {
                            var resultCode = 404;
                            var message = 'tag 작업중 에러가 발생했습니다';
                            if (err) {
                                console.log(err);
                            } else {
                                resultCode = 200;
                                message = 'tag count complate.';
                                //현재 태그중 존재하지 않는경우
                                if (result[0].cnt == 0) {
                                    // tag를 새로추가
                                    var sql3 = 'INSERT INTO Tag(tag_name) VALUES (?)';
                                    var params3 = [tag];
                                    connection.query(sql3, params3, function (err, result) {
                                        var sql4 = 'SELECT LAST_INSERT_ID() as lid';
                                        //추가된 태그의 고유 id 를 가져와 저장
                                        connection.query(sql4, function (err, result) {
                                            var resultCode = 404;
                                            var message = 'tagno 을 가져오는 작업중 에러가 발생했습니다';
                                            if (err) {
                                                console.log(err);
                                            }
                                            else {
                                                resultCode = 200;
                                                message = 'tagno load complate.';
                                                tagno = result[0].lid;
                                            }
                                        });
                                        var resultCode = 404;
                                        var message = 'tag 추가 작업중 에러가 발생했습니다';
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            resultCode = 200;
                                            message = 'tag insert complate.';

                                            var sql5 = 'INSERT INTO Post_Tag(postno,tagno) VALUES (?,?)';
                                            var params5 = [postno, tagno];
                                            connection.query(sql5, params5, function (err, result) {
                                                var resultCode = 404;
                                                var message = 'post_tag 추가 작업중 에러가 발생했습니다';
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    resultCode = 200;
                                                    message = 'post_tag insert complate.';
                                                }
                                            });
                                        }
                                    });
                                }
                                else {
                                    //테그가 이미 존재 할 시에
                                    var sql6 = 'SELECT tagno FROM Tag WHERE tag_name = ? ';
                                    var params6 = [tag];
                                    connection.query(sql6, params6, function (err, result) {
                                        var resultCode = 404;
                                        var message = 'post_tag 추가 작업중 에러가 발생했습니다';
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            resultCode = 200;
                                            message = 'check tag complate.';
                                            tagno = result[0].tagno;
                                            var sql7 = 'INSERT INTO Post_Tag(postno,tagno) VALUES (?,?)';
                                            var params7 = [postno, tagno];
                                            connection.query(sql7, params7, function (err, result) {

                                                var resultCode = 404;
                                                var message = 'post_tag 추가 작업중 에러가 발생했습니다';
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    resultCode = 200;
                                                    message = 'post_tag insert complate.';
                                                }

                                            });
                                        }

                                    });

                                }
                            }
                        });

                    })(i);
                }
            }
            res.json({
                'code': resultCode,
                'message': message
            });
        });
    });




    route.post('/login', function (req, res) {
        var userID = req.body.userID;
        var userPWD = req.body.userPWD;
        var sql = 'select * from Users where UserID = ?';
        connection.query(sql, userID, function (err, result) {
            var resultCode = 404;
            var message = '에러가 발생했습니다';

            if (err) {
                console.log(err);
            } else {
                if (result.length === 0) {
                    resultCode = 204;
                    message = '존재하지 않는 계정입니다!';
                } else if (userPWD !== result[0].UserPWD) {
                    resultCode = 204;
                    message = '비밀번호가 틀렸습니다!';
                } else {
                    resultCode = 200;
                    message = '로그인 성공! ' + result[0].UserID + '님 환영합니다!';
                    req.session.userID = result[0].UserID;
                    req.session.save(function () {

                    });
                }
            }

            res.json({
                'code': resultCode,
                'message': message
            });
        })
    });
    return route;
};