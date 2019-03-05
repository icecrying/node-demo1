var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
//引入cookie
var cookie = require('cookie');
//引入数据库
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'ajaxdemo'
});
connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});

var app = http.createServer(function (req, res) {
    var url_obj = url.parse(req.url);
    if (url_obj.pathname === '/') {
        render('./template/index.html',res);
        return;
    }
    //处理注册功能的逻辑
    if (url_obj.pathname == '/register' && req.method == 'POST') {
        //接受前台发送过来的数据
        var user_info = '';
        req.on('data',function (chunk) {
            user_info += chunk;
        });
        req.on('end',function (err) {
            if (!err) {
                res.setHeader('content-type', 'text/html;charset=utf-8');
                var user_obj = querystring.parse(user_info);
                //验证数据
                if (user_obj.username == '' || user_obj.password == '') {
                    res.write('{"status":1,"message":"用户名或者密码不能为空"}','utf-8');
                    res.end();
                    return;
                }
                if(user_obj.password !== user_obj.repassword ){
                    res.write('{"status":1, "message": "两次输⼊密码不⼀致"}', 'utf-8');
                    res.end();
                    return;
                }
                //链接数据库
                //把插入的内容放入sql中
                var sql = 'INSERT INTO admin(username,password) VALUE("'+user_obj.username+'","'+user_obj.password+'")';
                        connection.query(sql,function (error, result) {
                            //如果没有错误，并且result长度不为0，返回注册成功提示
                            if (!error && result && result.length !== 0) {
                                res.write('{"status":0, "message": "注册成功"}', 'utf-8');
                                res.end();
                                return;
                    }
                })
            }
        });
        return;
    }
    //处理登录功能的逻辑
    if (url_obj.pathname == '/login' && req.method == 'POST') {
        var user_info ="";
        req.on("data",function (chunk) {
            user_info += chunk;
        });
        req.on("end",function (err) {
            res.setHeader('content-type', 'text/html;charset=utf-8');
            var user_obj=querystring.parse(user_info);
            if (!err) {
                //连接数据库
                //查询数据库，然后把查询的结果放在sqlzhong
                var sql ='SELECT * FROM admin WHERE username="'+user_obj.username+'" AND password="'+user_obj.password+'"';
                connection.query(sql,function (error, result) {
                    if (!error && result && result.length !== 0) {
                        // 这⾥是使用cookie，给浏览器加一个名字为isLogin的标识
                        res.setHeader('Set-Cookie', cookie.serialize('isLogin', "true"));
                        res.write('{"status":0, "message": "登录成功"}', 'utf-8');
                        res.end();
                    }else {
                        res.write('{"status":1, "message": "用户名或密码错误"}', 'utf-8');
                        res.end();
                    }
                })
            }
        })
        return;
    }

    //处理表格的数据
    if (url_obj.pathname == '/list' && req.method == 'GET') {
        res.setHeader('content-type', 'text/html;charset=utf-8');
        //连接数据库
        var sql = 'SELECT * FROM user';
        connection.query(sql,function (error, result) {
            if (!error && result) {
                //把结果传回去
                //把结果result转化为对象
                var arrstr = JSON.stringify(result);
                res.write('{"status":0,"data":'+arrstr+'}','utf-8');
                res.end();
            }
        });
        return;
    }
    //处理用户管理界面传过来的数据
    if (url_obj.pathname == '/adduser' && req.method == 'POST') {
        res.setHeader('content-type', 'text/html;charset=utf-8');
        var user_info = '';
        req.on('data',function (chunk) {
            user_info += chunk;
        });
        req.on('end',function (err) {
            if (!err) {
                var user_obj = querystring.parse(user_info);
                //把数据写入数据库
                var sql = 'INSERT INTO user VALUE('+null+',"'+user_obj.username+'","'+user_obj.email+'","'+user_obj.phone+'","'+user_obj.qq+'")';
                connection.query(sql,function (error, result) {
                    if (!error && result && result.length !== 0) {
                        res.write('{"status":0,"message":"添加成功"}');
                        res.end();
                        return;
                    }else {
                        res.write('{"status":1,"message":"添加失败"}');
                        res.end();
                        return;
                    }
                });
                console.log(sql)
            }
        });
        return;
    }
    //处理修改信息时传过来的数据
    if (url_obj.pathname == '/update' && req.method == 'POST') {
        var user_info = '';
        req.on("data",function (chunk) {
            user_info += chunk;
        })
        req.on("end",function (err) {
            if (!err) {
                var user_obj = querystring.parse(user_info);
                //修改数据库
                var sql = 'UPDATE user SET username="'+user_obj.username+'",email="'+user_obj.email+'",phone="'+user_obj.phone+'",qq="'+user_obj.qq+'" WHERE id='+Number(user_obj.id);
                connection.query(sql,function (error, result) {
                    if (!error && result) {
                        res.write('{"status":0,"message":"修改成功"}');
                        res.end();
                        return;
                    }else {
                        res.write('{"status":1,"message":"修改失败"}');
                        res.end();
                        return;
                    }
                })
            }
        });
        return;
    }
    //删除信息
    if (url_obj.pathname == '/delete' && req.method == 'POST') {
        var user_info = "";
        req.on("data",function (chunk) {
            user_info += chunk;
        })
        req.on("end",function (err) {
            if (!err) {
                var user_obj = querystring.parse(user_info);
                //删除数据库
                var sql = 'DELETE FROM user WHERE id='+Number(user_obj.id) ;
                connection.query(sql,function (error, result) {
                    if (!error && result) {
                        res.write('{"status":0,"message":"删除成功"}');
                        res.end();
                    }else {
                        res.write('{"status":1,"message":"删除失败"}');
                        res.end();
                    }
                })
            }
        });
        return;
    }

    //设置和获取cookie
/*    if (url_obj.pathname == '/setcookie') {
        //设置请求头，添加一个新内容，返回一个是否登录的标识。
        res.setHeader('Set-Cookie', cookie.serialize('isLogin', "true"));
    }
    if (url_obj.pathname == '/getcookie') {
        //获取我们设置的标识，如cookie_obj.isLogin就是我们在设置cookie时设置的标识
        var cookie_obj = cookie.parse(req.headers.cookie || '')
    }*/
    //返回admin.html页面时需要做cookie验证
    if (url_obj.pathname == '/admin.html') {
        //把cookie的标识转化为对象并赋值
        var cookie_obj = cookie.parse(req.headers.cookie || '');
        //找到对应的cookie标识并作出判断 isLogin是我们在前面给cookie设置的登录标识名字
        if (cookie_obj.isLogin == 'true') {
            render("./template/admin.html", res);
        }else {
            render("./template/test.html", res);
        }
        return;
    }
    //退出用户管理界面，情况cookie
    if (url_obj.pathname == '/logout') {
        res.setHeader('Set-Cookie', cookie.serialize('isLogin', ""));
        render('.template/index.html',res)
        return;
    }
    render("./template"+url_obj.pathname,res);
});
app.listen(3000,function (err) {
    if (!err) {
        console.log("listening on 3000");
    }
});
function render(path, res) {
    //binary表示打开方式为二进制
    fs.readFile(path,'binary',function (err, data) {
        if (!err) {
            res.write(data,'binary');
            res.end();
        }
    })
}
