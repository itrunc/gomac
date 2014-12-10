// 在 Cloud code 里初始化 Express 框架
var url = require('url');
var express = require('express');
var app = express();

// App 全局配置
app.set('views','cloud/views');   // 设置模板目录
app.set('view engine', 'ejs');    // 设置 template 引擎
app.use(express.bodyParser());    // 读取请求 body 的中间件

// 使用 Express 路由 API 服务 /hello 的 HTTP GET 请求
//app.get('/hello', function(req, res) {
//  res.render('hello', { message: 'Congrats, you just set up your app!' });
//});

app.get('/', function(req, res){
    res.render('index');
});
app.get('/index', function(req, res) {
    res.redirect('/');
});

app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/login', function(req, res) {
    var referer = req.get('Referer') || '/';
    res.render('login', {'referer': url.parse(referer).path});
});

app.get('/logout', function(req, res) {
    res.render('logout');
});

app.get('/survey', function(req, res){
    res.render('survey');
});
/*
app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    AV.User.logIn(username, password, {
        success: function(user) {
            res.json({
                'url': '/index'
            });
        },
        error: function(user, error) {
            res.status(500).json({
                'code' : error.code,
                'message' : error.message
            });
        }
    });
});


app.post('/register', function (req, res) {
    var username = req.body.usrname;
    var passwd = req.body.passwd;
    var confirmPasswd = req.body.confirmpasswd;
    if( passwd != confirmPasswd ) {
        res.send('确认密码与密码不一致');
        return;
    }
    var user = new AV.User();
    user.set('username', username);
    user.set('password', passwd);
    user.signUp(null, {
        success: function(user) {
            res.redirect('/index');
        },
        error: function(user, error) {
            res.send("Error: " + error.code + " " + error.message);
        }
    });
});
*/

// 最后，必须有这行代码来使 express 响应 HTTP 请求
app.listen();