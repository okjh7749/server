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

    route.post('/addpost', async (req, res) => {
        const connection = await pool.getConnection(async conn => conn);
        //await connection.beginTransaction();
        console.log(req.body);
        var matches = [];
        var i = 0;
        var title = req.body.title;
        var writer = req.body.writer;
        var content = req.body.content;
        var write_date = date;
        var tags = req.body.content;
        var postno;
        var tagno;
        resultCode = 404;
        message = 'fail';
        tags = tags.split(/(#[^#\s]+)/g).map(v => {
            if (v.match('#')) {
                matches[i++] = v;
            }
            return v;
        });

        try {
            //�Խñ� ���
            var sql = 'INSERT INTO Post (title, content,writer,write_date) VALUES (?, ?, ?, ?)';
            var params = [title, content, writer, write_date];
            let result = await connection.execute(sql, params);
            if (result[0].affectedRows == 0) {
                throw new Error("affectedRows is zero where post");
                resultCode = 404;
                message = 'write fail';
                console.log(message);
            }
            //�߰��� �Խñ� ������ȣ ȹ��
            var sql1 = 'SELECT LAST_INSERT_ID() as lid';
            let result1 = await connection.execute(sql1);
            if (result1[0].affectedRows == 0) {
                throw new Error("affectedRows is zero where menu posttable");
                resultCode = 404;
                message = 'get postno fail';
                console.log(message);
            }
            else {
                postno = result1[0][0].lid;
                console.log(postno);
            }
            //�ױ��� ������ŭ �ݺ�
            var size = matches.length;
            for (var i = 0; i < size; i++) {
                //���� �������� �ױװ� �����ϴ��� Ȯ��
                var tag = matches[i];
                var sql2 = 'SELECT COUNT(*) as cnt FROM Tag WHERE tag_name = ?';
                var params2 = [tag];
                let result2 = await connection.execute(sql2, params2);
                if (result2[0].affectedRows == 0) {
                    throw new Error("affectedRows is zero where menu tag");
                    resultCode = 404;
                    message = 'check tag fail';
                    console.log(message);
                }
                //���� ���� �������� �ױװ� ���̺� ���ٸ�
                if (result2[0][0].cnt == 0) {
                    //�ױ׸� ���̺� �߰�
                    var sql3 = 'INSERT INTO Tag(tag_name) VALUES (?)';
                    var params3 = [tag];
                    let result3 = await connection.execute(sql3, params3);
                    if (result3[0].affectedRows == 0) {
                        throw new Error("affectedRows is zero where menu tagtable");
                        resultCode = 404;
                        message = 'add tag fail 1';
                        console.log(message);
                    }
                    //�߰��� �ױ� ������ȣ ȹ��
                    var sql4 = 'SELECT LAST_INSERT_ID() as lid';
                    let result4 = await connection.execute(sql4);
                    if (result4[0].affectedRows == 0) {
                        throw new Error("affectedRows is zero where menu tagno");
                        resultCode = 404;
                        message = 'get tagno fail';
                        console.log(message);
                    }
                    else {
                        tagno = result4[0][0].lid;
                    }
                }
                //���� �������� �ױװ� �ױ� ���̺� �����߾��ٸ�
                else {
                    var sql5 = 'SELECT tagno FROM Tag WHERE tag_name = ? ';
                    var params5 = [tag];
                    let result5 = await connection.execute(sql5, params5);
                    if (result5[0].affectedRows == 0) {
                        throw new Error("affectedRows is zero where menu tagtable");
                        resultCode = 404;
                        message = 'find tag fail';
                        console.log(message);
                    }
                    else {
                        tagno = result5[0][0].tagno;
                    }
                }
                //�ױ�ó���� �ױ� ���� ��ȣ�� �޾ƿ� ��
                //�Խñ۰� �ױ׸� ���� �� ����
                var sql6 = 'INSERT INTO Post_Tag(postno,tagno) VALUES (?,?)';
                var params6 = [postno, tagno];
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
                }
            }
        } catch (err) {
            await connection.rollback();
            res.json({
                'code': resultCode,
                'message': "��� ����"
            });
            throw err;

        } finally {
            
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });

    return route;
};