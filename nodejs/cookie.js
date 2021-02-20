var http = require('http');
var cookie = require('cookie');
http.createServer(function (request, response) {
  console.log(request.headers.cookie); // yummy_cookie=choco; tasty_cookie=strawberry
  
  // var cookies = cookie.parse(request.headers.cookie); // 객체화 ex) { yummy_cookie = 'choco', tasty_cookie = 'strawberry' } , 쿠키값이 지워졌을때 undefind가 뜨는데 parse는 undefind 값을 수용하지 못한다.
  var cookies = {};
  if(request.headers.cookie !== undefined){ //parse가 undefind를 수용하지 못하는 것을 방지하여 if문을 이용해 undefind가 아니라면 cookies 배열에 값 삽입  
    cookies = cookie.parse(request.headers.cookie);
  }

  // console.log(cookies.yummy_cookie); //yummy_cookie 의 value값 출력
  // console.log(cookies.tasty_cookie); //tasty_cookie 의 value값 출력
  
  response.writeHead(200, {  //쿠키생성
    'Set-Cookie': [
      'yummy_cookie=choco', 
      'tasty_cookie=strawberry',
      `Permanent=cookies; Max-Age =${60*60*24*30}`, //Max-Age : 현재 시점을 기준으로 언제까지 살아있을지 정하는 것, 단위 : 초
      'Secure=Secure; Secure',
      'HttpOnly=HttpOnly; HttpOnly', // 참고 : https://nsinc.tistory.com/121
      'Path=Path; Path=/cookie', // /cookie가 붙은 디렉토리에서만 쿠키를 보이게 할수있다.
      'Domain = Domain; Domain=o2.org'
    ]
  }); // F12에서 response header에서 확인가능

  response.end('Cookie!!'); //페이지에 Cookie!!출력
}).listen(3000);


// Session cookies 와 Permanent cookies 차이점
// Session cookies : 서버가 켜져있는동안만 지속되는 쿠키 (다시키면 사라져있는 쿠키)
// Permanent cookies : 지속되는 쿠키 (다시켜도 지속되어 있는 쿠키)