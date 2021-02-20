var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var cookie = require('cookie');

function authIsOwner(request, response) { // 만약 cookie에 email값과 password값이 있다면 로그인했다는 것을 알기위해 isOwner변수에 true 값을 넣는다.
  var isOwner = false;
  var cookies = {};
  if (request.headers.cookie) {
    var cookies = cookie.parse(request.headers.cookie);
  }
  if (cookies.email === 'NGJ@gmail.com' && cookies.password === '123456') {
    isOwner = true;
  }
  return isOwner;
}

function authStatusUi(request, response) { //로그인이 되어있다면 로그인 text를 logout으로 바꿔주는것
  var authStatusUi = '<a href="/login">login</a>'
  if (authIsOwner(request, response)) { // 만약 autIsOwner함수의 리턴값이 true라면 아래 코드를 실행하고 만약 false라면 넘어가서 그냥 텍스트를 login으로 설정함
    authStatusUi = '<a href="/logout_process">logout</a>';
  }
  return authStatusUi;
}

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === '/') {
    if (queryData.id === undefined) {
      fs.readdir('./data', function (error, filelist) {
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`,
          authStatusUi(request, response)
        );
        response.writeHead(200);
        response.end(html);
      });
    } else {
      fs.readdir('./data', function (error, filelist) {
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
          var title = queryData.id;
          var sanitizedTitle = sanitizeHtml(title);
          var sanitizedDescription = sanitizeHtml(description, {
            allowedTags: ['h1']
          });
          var list = template.list(filelist);
          var html = template.HTML(sanitizedTitle, list,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
            ` <a href="/create">create</a>
                <a href="/update?id=${sanitizedTitle}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete">
                </form>`, authStatusUi(request, response)
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    }
  } else if (pathname === '/create') {
    if(authIsOwner(request,response) === false){ // 만약 로그인이 되어있지 않다면 /login_process 의 실행을 멈추고 login required라는 텍스트를 사이트에 출력하게함
      response.end('Login required!!');
      return false;
    }
    fs.readdir('./data', function (error, filelist) {
      var title = 'WEB - create';
      var list = template.list(filelist);
      var html = template.HTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '', authStatusUi(request, response));
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === '/create_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
        response.writeHead(302, { Location: `/?id=${title}` });
        response.end();
      })
    });
  } else if (pathname === '/update') {
    if(authIsOwner(request,response) === false){ // 만약 로그인이 되어있지 않다면 /login_process 의 실행을 멈추고 login required라는 텍스트를 사이트에 출력하게함
      response.end('Login required!!');
      return false;
    }
    fs.readdir('./data', function (error, filelist) {
      var filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`,
          authStatusUi(request, response)
        );
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === '/update_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function (error) {
        fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
          response.writeHead(302, { Location: `/?id=${title}` });
          response.end();
        })
      });
    });
  } else if (pathname === '/delete_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var id = post.id;
      var filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function (error) {
        response.writeHead(302, { Location: `/` });
        response.end();
      })
    });
  } else if (pathname === "/login") {
    fs.readdir('./data', function (error, filelist) {
      var title = 'Login';
      var list = template.list(filelist);
      var html = template.HTML(title, list,
        `
          <form action="login_process" method="post">
            <p><input type="text" name="email" placeholder="email"></p>
            <p><input type="password" name="password" placeholder="password"></p>
            <p><input type="submit"></p>
          </form>
          `,
        `<a href="/create">create</a>`
      );
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === "/login_process") {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      if (post.email === "NGJ@gmail.com" && post.password === "123456") {
        response.writeHead(302, {
          'Set-Cookie': [
            `email = ${post.email}`,
            `password = ${post.password}`,
            `nickname = NGJ`
          ],
          Location: `/`
        });
        response.end();
      } else {
        response.end('Who?');
      }
    });
  } else if (pathname === "/logout_process") { // /logout_process 디렉토리로 접근했을때 쿠키의 값을 지워주는 역할
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      response.writeHead(302, {
        'Set-Cookie': [
          `email = ; Max-Age=0`,
          `password =; Max-Age=0`,
          `nickname =; Max-Age=0`
        ],
        Location: `/`
      });
      response.end();
    });
  } else {
    response.writeHead(404);
    response.end('Not found');
  }
});
app.listen(3000);
