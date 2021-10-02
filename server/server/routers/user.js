module.exports = function (app) {
    var express = require('express');
    var route = express.Router();
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: "ec2-3-36-182-213.ap-northeast-2.compute.amazonaws.com",
        user: "jh",
        database: "server",
        password: "ckddlfwnd3349!",
        port: 3306
    });
  
   
    route.post('/join', function (req, res) {
        var userID = req.body.UserID;
        var userPWD = req.body.UserPWD;
        var userPWD2 = req.body.UserPWD2;
        
        // 삽입을 수행하는 sql문.
        var sql = 'INSERT INTO Users (UserID, UserPWD) VALUES (?, ?)';
        var params = [userID, userPWD];
        if (userPWD == userPWD2) {
            // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
            connection.query(sql, params, function (err, result) {
                var resultCode = 404;
                var message = '에러가 발생했습니다';

                if (err) {
                    console.log(err);
                } else {
                    resultCode = 200;
                    message = 'join complate.';
                }
                res.json({
                    'code': resultCode,
                    'message': message
                });
            });
        }
    });

    route.post('/login', function (req, res) {
        var userID = req.body.UserID;
        var userPWD = req.body.UserPWD;
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
                    req.session.userID = (result[0].UserID);
                    req.session.save(function () {
                        
                    });

                }
            }

            res.json({
                'code': resultCode,
                'message': message
            });
            console.log(resultCode);
        })
    });
    return route;
};