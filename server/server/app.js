var express = require('express');
var app = express();
var fs = require('fs');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
var date = moment().format('YYYY-MM-DD HH:mm:ss');

var mysql = require('mysql');
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
var p1 = require('./routers/p1')(app);

var user = require('./routers/user')(app);

var posting = require('./routers/posting')(app);
var iposting = require('./routers/iposting')(app);
var lookup = require('./routers/lookup')(app);

var lostdog = require('./routers/lostdog')(app);

app.use('/p1', p1);
app.use('/user', user);
app.use('/posting', posting);
app.use('/iposting', iposting);
app.use('/lookup', lookup);
app.use('/lostdog', lostdog);




var dir = './uploadedFiles';
app.listen(3000, 'localhost', function () {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    console.log('서버 실행 중...');
});
