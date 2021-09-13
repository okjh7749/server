module.exports = function (app) {
    var express = require('express');
    var route = express.Router();
    var bodyParser = require('body-parser');
    var moment = require('moment');

    const multer = require("multer");
    const path = require("path");

    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "public/images/");
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + "-" + Date.now() + ext);
        },
    });
    var upload = multer({ storage: storage });

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


    route.post('/findm', upload.single("image"), async (req, res) => {
        //res.render('confirmation', { file: null, files: req.files });
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
        var writer = "test1"//session.getAttribute("userID");
        var content = req.body.content;
        var write_date = date;
        var ipostno;
        console.log(req.file);
        var img = '/images/' + req.file.filename;
        console.log(img);
        resultCode = 404;
        message = 'fail';
        
        try {

            console.log("start");
            //게시글 등록
            var sql = 'INSERT INTO iPost (title, content,writer,write_date,img) VALUES (?, ?, ?, ?, ?)';
            var params = [title, content, writer, write_date, img];
            let result = await connection.execute(sql, params);
            if (result[0].affectedRows == 0) {
                throw new Error("affectedRows is zero where post");
                resultCode = 404;
                message = 'write fail';
                console.log(message);
            }
            console.log("get postno");
            //추가된 게시글 고유번호 획득
            var sql1 = 'SELECT LAST_INSERT_ID() as lid';
            let result1 = await connection.execute(sql1);
            if (result1[0].affectedRows == 0) {
                throw new Error("affectedRows is zero where menu posttable");
                resultCode = 404;
                message = 'get postno fail';
                console.log(message);
            }
            else {
                ipostno = result1[0][0].lid;
            }
            //테그의 갯수만큼 반복
            console.log("start tagmatch");
            var size = matches.length;
            for (var i = 0; i < size; i++) {
                //현재 진행중인 테그가 존재하는지 확인
                var tag = matches[i];
                console.log(tag);
                var sql2 = 'SELECT COUNT(*) as cnt FROM iTag WHERE tag_name = ?';
                var params2 = [tag];
                let result2 = await connection.execute(sql2, params2);
                if (result2[0].affectedRows == 0) {
                    throw new Error("affectedRows is zero where menu tag");
                    resultCode = 404;
                    message = 'check tag fail';
                    console.log(message);
                }
                //만약 현재 진행중인 테그가 테이블에 없다면
                if (result2[0][0].cnt == 0) {
                    //테그를 테이블에 추가
                    var sql3 = 'INSERT INTO iTag(tag_name) VALUES (?)';
                    var params3 = [tag];
                    let result3 = await connection.execute(sql3, params3);
                    if (result3[0].affectedRows == 0) {
                        throw new Error("affectedRows is zero where menu tagtable");
                        resultCode = 404;
                        message = 'add tag fail 1';
                        console.log(message);
                    }
                    //추가된 테그 고유번호 획득
                    var sql4 = 'SELECT LAST_INSERT_ID() as lid';
                    let result4 = await connection.execute(sql4);
                    if (result4[0].affectedRows == 0) {
                        throw new Error("affectedRows is zero where menu tagno");
                        resultCode = 404;
                        message = 'get tagno fail';
                        console.log(message);
                    }
                    else {
                        itagno = result4[0][0].lid;
                    }
                }
                //현재 진행중인 테그가 테그 테이블에 존재했었다면
                else {
                    var sql5 = 'SELECT itagno FROM iTag WHERE tag_name = ? ';
                    var params5 = [tag];
                    let result5 = await connection.execute(sql5, params5);
                    if (result5[0].affectedRows == 0) {
                        throw new Error("affectedRows is zero where menu tagtable");
                        resultCode = 404;
                        message = 'find tag fail';
                        console.log(message);
                    }
                    else {
                        console.log(result5);
                        itagno = result5[0][0].itagno;
                    }
                }
                //테그처리후 테그 고유 번호를 받아온 뒤
                //게시글과 테그를 결합 후 저장
                var sql6 = 'INSERT INTO iPost_iTag(ipostno,itagno) VALUES (?,?)';
                var params6 = [ipostno, itagno];
                let result6 = await connection.execute(sql6, params6);
                if (result6[0].affectedRows == 0) {
                    throw new Error("affectedRows is zero where menu post_tag table");
                    resultCode = 404;
                    message = 'add post_tag fail';
                    console.log(message);
                }
                else {
                    resultCode = 200;
                    message = 'write complate';
                    console.log(message);
                }
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
            'code': resultCode,
            'message': message,
            file: null, files: req.files
        });
    });

    return route;
};