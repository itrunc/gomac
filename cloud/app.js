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

//首页
app.get('/', function(req, res){
    var assign = {
        appname: 'home'
    };
    res.render('index', assign);
});
app.get('/index', function(req, res) {
    res.redirect('/');
});

//新用户注册
app.get('/register', function (req, res) {
    var assign = {
        appname: 'register'
    };
    res.render('register', assign);
});

//登录
app.get('/login', function(req, res) {
    var referer = req.get('Referer') || '/';
    var assign = {
        appname: 'login',
        referer: url.parse(referer).path
    };
    res.render('login', assign);
});

//退出
app.get('/logout', function(req, res) {
    var assign = {
        appname: 'logout'
    };
    res.render('logout', assign);
});

//邮箱验证
app.get('/verify', function(req, res) {
    var assign = {
        appname: 'verify'
    };
    res.render('verify', assign);
});

//密码重置
app.get('/reset', function(req, res) {
    var assign = {
        appname: 'reset'
    };
    res.render('reset', assign);
});

//调查
app.get('/survey', function(req, res){
    var assign = {
        appname: 'survey'
    };
    res.render('survey', assign);
});


// 最后，必须有这行代码来使 express 响应 HTTP 请求
app.listen();