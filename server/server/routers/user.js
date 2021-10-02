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
        
        // ������ �����ϴ� sql��.
        var sql = 'INSERT INTO Users (UserID, UserPWD) VALUES (?, ?)';
        var params = [userID, userPWD];
        if (userPWD == userPWD2) {
            // sql ���� ?�� �ι�° �Ű������� �Ѱ��� params�� ������ ġȯ�ȴ�.
            connection.query(sql, params, function (err, result) {
                var resultCode = 404;
                var message = '������ �߻��߽��ϴ�';

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