

// dependencies ==============================================================
var express 	= require('express');
var app 		= express();
var path 		= require('path'); // core nodejs module
var bodyParser 	= require('body-parser');
var jade 		= require('jade');
var favicon 	= require('serve-favicon');
var port 		= process.env.PORT || 3000;
var database 	= require('./config/db');
var mongoose 	= require('mongoose');
var database 	= require('./config/db');
var environment = app.settings.env;

(function connectDB(){
	if(environment === 'development'){
		mongoose.connect('mongodb://localhost/test');
	} else {
		mongoose.connect('mongodb://heroku_375q6vw3:heroku_375q6vw3@ds033760.mongolab.com:33760/heroku_375q6vw3');
	}
})();

//app confings ===============================================================
app.set('views', path.join(__dirname, './public'));
app.set('view engine', 'jade');

//use middleware =============================================================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// make this route public
app.use(express.static(__dirname + '/public'));
app.use(favicon(__dirname + '/favicon.png')); // favicon

//modules =====================================================================
app.use(require('./router')); //Router
app.use(require('./api/api'));//API

// start the app =============================================================
app.listen(port, function(){
	console.log('app is runnin on port ' + port);
	console.log('environment: ' + environment);
});
























// req- request, res - responce
app.get('/login', function(req, res){
	res.send('hello login');
});

// req- request, res - responce
app.get('/api/user/:id', function(req, res){
	var userId = req.params.id;
	console.log(userId);
	res.send('hello user your id is'+ userId);
});

// req- request, res - responce
app.post('/login', function(req, res){
	res.send('hello'+req);
	console.log(req);
});






// var http = require('http');
// http.createServer(function (req, res) {
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   res.end('Hello World\n');
// }).listen(1337, '127.0.0.1');
// console.log('Server running at http://127.0.0.1:1337/');