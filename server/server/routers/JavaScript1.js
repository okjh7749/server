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
            var message = '�۾��� ������ �߻��߽��ϴ�';
            if (err) {
                console.log(err);
            } else {
                resultCode = 200;
                message = 'post complate.';
                var sql1 = 'SELECT LAST_INSERT_ID() as lid';
                //�߰��� ����Ʈ�� ���� id �� ������ ����
                connection.query(sql1, function (err, result) {
                    postno = result[0].lid;
                });
                var size = matches.length;
                for (var i = 0; i < size; i++) {
                    (function (i) {
                        if (i > 2)
                            return 0;
                        var tag = matches[i];
                        //���� �����ϴ� �±����� Ȯ���ϴ� sql��
                        var sql2 = 'SELECT COUNT(*) as cnt FROM Tag WHERE tag_name = ?';
                        var params2 = [tag];
                        connection.query(sql2, params2, function (err, result) {
                            var resultCode = 404;
                            var message = 'tag �۾��� ������ �߻��߽��ϴ�';
                            if (err) {
                                console.log(err);
                            } else {
                                resultCode = 200;
                                message = 'tag count complate.';
                                //���� �±��� �������� �ʴ°��
                                if (result[0].cnt == 0) {
                                    // tag�� �����߰�
                                    var sql3 = 'INSERT INTO Tag(tag_name) VALUES (?)';
                                    var params3 = [tag];
                                    connection.query(sql3, params3, function (err, result) {
                                        var sql4 = 'SELECT LAST_INSERT_ID() as lid';
                                        //�߰��� �±��� ���� id �� ������ ����
                                        connection.query(sql4, function (err, result) {
                                            var resultCode = 404;
                                            var message = 'tagno �� �������� �۾��� ������ �߻��߽��ϴ�';
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
                                        var message = 'tag �߰� �۾��� ������ �߻��߽��ϴ�';
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            resultCode = 200;
                                            message = 'tag insert complate.';

                                            var sql5 = 'INSERT INTO Post_Tag(postno,tagno) VALUES (?,?)';
                                            var params5 = [postno, tagno];
                                            connection.query(sql5, params5, function (err, result) {
                                                var resultCode = 404;
                                                var message = 'post_tag �߰� �۾��� ������ �߻��߽��ϴ�';
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
                                    //�ױװ� �̹� ���� �� �ÿ�
                                    var sql6 = 'SELECT tagno FROM Tag WHERE tag_name = ? ';
                                    var params6 = [tag];
                                    connection.query(sql6, params6, function (err, result) {
                                        var resultCode = 404;
                                        var message = 'post_tag �߰� �۾��� ������ �߻��߽��ϴ�';
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
                                                var message = 'post_tag �߰� �۾��� ������ �߻��߽��ϴ�';
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
            var message = '������ �߻��߽��ϴ�';

            if (err) {
                console.log(err);
            } else {
                if (result.length === 0) {
                    resultCode = 204;
                    message = '�������� �ʴ� �����Դϴ�!';
                } else if (userPWD !== result[0].UserPWD) {
                    resultCode = 204;
                    message = '��й�ȣ�� Ʋ�Ƚ��ϴ�!';
                } else {
                    resultCode = 200;
                    message = '�α��� ����! ' + result[0].UserID + '�� ȯ���մϴ�!';
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