// dependencies
var express      	= require('express');
var api       	  = express.Router();
var shortid      	= require('shortid');
var multer       	= require('multer');
var mailer       	= require('./../config/mail.js');
var mailTpl      	= require('./../config/emailTpl.js');
var adminDetails 	= require('./../config/admin.js');
var done         	= false;
var filenameSave 	= '';
var fs 						= require('fs');
// db
var Users 			= require("../../dbmodels/Users").Users;
var Emails 			= require('../../dbmodels/Emails').Emails;
var LoginData 	= require('../../dbmodels/LoginData').LoginData;
var Blog 				= require('../../dbmodels/BlogPost').Blog;
var BlogImages 	= require('../../dbmodels/BlogImages').BlogImages;

/* Multer config */

api.use(multer({ dest: 'src/public/',
	changeDest: function(dest, req, res) {
		var dir = '/uploads/';
		if(req.body.dir) { dir += req.body.dir; }
		return dest + req.body.username + dir;
	},
	rename: function (fieldname, filename, req, res) {
		var filenameForSave = !req.body.blog ? Date.now()+filename : 'blog/' + Date.now()+filename;
		filenameSave = "uploads/"+filenameForSave+'.'+req.body.extention;
		return filenameForSave;
	},
	onFileUploadStart: function (file) {
		console.log(file.originalname + ' is starting ...');
	},
	onFileUploadComplete: function (file) {
		console.log(file.fieldname + ' uploaded to  ' + file.path);
		done=true;
	}
}));



/*=================== main API ========================*/
/*=================== TODO: Docu ======================*/
/*=====================================================*/




api.get('/api/users', function(req, res){
	Users.find({}, { password: 0 }, function(err, users) {
		var userMap = {};

		users.forEach(function(user) {
		  userMap[user._id] = user;
		});
		res.send({
			users: userMap
		});
	});
});

api.get('/api/user-by-id/:id', function(req, res){
	Users.findOne({_id: req.params.id}, { password: 0 }, function(err, user) {
		if (err) {console.log(err); res.send(err); return;}
		res.send({ user: user });
	});
});

api.post('/api/add-user', function(req, res){
	var newUser = new Users({
			_id: shortid.generate(),
			name: {
				first : req.body.firstName,
				last 	: req.body.lastName
			},
			age 		: req.body.age,
			email		: req.body.email,
			category	: req.body.role,
			password	: req.body.password,
			avatar		: filenameSave || req.body.avatar
		});
	newUser.save(function (err) {
	  if (err) {console.log(err); res.send(err); return;}
	  console.log('user ' + req.body.firstName + 'saved');
	  res.send('user added success');
	});
});

api.post('/api/photo', function(req, res){
	if(done === true){
		res.end('Success uplodaing image');
	}
});

api.post('/api/login', function(req, res){
		Users.find({password: req.body.pass, email: req.body.email}, { password: 0 },
			function(err, user) {
				if (err) {console.log(err); res.send(err); return;}
				if(user.length){
					delete user[0].password;
					var date = Date.now();
					var newLogin = new LoginData({_id: shortid.generate(), userId: user[0]._id, date: date});
					newLogin.save(function(err){
						if (err) {console.log(err); res.send(err); return;}
					});
					Users.update({_id: user[0]._id }, {lastLogin: date} ,{},function(err, result) {
						if (err) {console.log(err); res.send(err); return;}
						res.send({ user: user });
					});
				} else {
					res.send({ user: {}});
				}
		});
});

api.get('/api/get-login-data/:id', function(req, res){
	LoginData.find({userId: req.params.id }, function(err, loginData) {
		if (err) {console.log(err); res.send(err); return;}
		res.send({
			loginData: loginData
		});
	});
});

api.get('/api/get-email-data', function(req, res){
	Emails.find({}, function(err, emailsData) {
		if (err) {console.log(err); res.send(err); return;}
		res.send({
			emailsData: emailsData
		});
	});
});

api.get('/api/read-email/:id', function(req, res){
	Emails.update({_id : req.params.id}, {unread: req.params.unread},{},
		function(err, email){
			if (err) {console.log(err); res.send(err); return;}
			console.log('email updated');
			res.send({ result: 'success' });
		});
});

api.get('/api/email-by-id/:id', function(req, res){
	Emails.find({_id : req.params.id},
		function(err, email){
			if (err) {console.log(err); res.send(err); return;}
			res.send({ email: email });
		});
});

api.delete('/api/delete-email/:id', function(req, res){
	Emails.remove({_id : req.params.id},
		function(err, email){
			if (err) {console.log(err); res.send(err); return;}
			res.send({ result: 'success' });
		});
});

api.post('/api/reset-pass', function(req, res){
	Users.find({email: req.body.email},
		function(err, user){
			if (err) {console.log(err); res.send(err); return;}
			if (user.length){
				var newPass = shortid.generate();
				Users.update({email: req.body.email}, {password: newPass},{},
					function(err, user){

						if (err) {console.log(err); res.send(err); return;}
						var mailOptions = {
						    from: adminDetails.app.email,
						    sender: adminDetails.app.email,
						    to: req.body.email, // list of receivers
						    subject: adminDetails.app.name + ' Password reneval ✔', // Subject line
						    html: mailTpl.passwordReneval(newPass) // html body
						};

						mailer.sendMail(mailOptions, function(error, info){
						    if(error){
						    		res.send(error);
						        console.log(error);
						    }else{
						    		res.send({success: 'message sent'});
						        console.log('Message sent: ' + info.response);
						    }
						});
				});
			} else {
				res.send({error: 'no user found'});
			}
		});
});

/**
*	Update user
*/
api.post('/api/update_user', function(req, res){
	var newUser = {
			name: {
				first      : req.body.name.first,
				last 	     : req.body.name.last
			},
			age 		     : req.body.age,
			email		     : req.body.email,
			category	   : req.body.category,
			active       : req.body.active,
			blogSubscribe: req.body.blogSubscribe,
			avatar		   : !!filenameSave ? filenameSave : req.body.avatar,
			_id          : req.body._id
	};
	Users.update({_id: req.body._id }, newUser ,{},function(err, result) {
	    if (err) { console.log(err); res.send(err); return;}
	    console.log('user ' + req.body.name.first + req.body.name.last + ' updated');
	    res.send({ user: newUser, resMessage : 'user update success' });
	   	filenameSave = '';
  	});
});

api.delete('/api/delete-user/:id', function(req, res){
	Users.remove({_id: req.params.id}, function(err, user){
		if (err) { console.log(err); res.send(err); return;}
		res.send('success delteing user');
	});
});

/**
* Send message to user
* @params{object} email params
* @returns{string} success/error
*/
api.post('/api/send-message', function(req, res){
		var mail = {
		    from: adminDetails.app.email,
		    sender: req.body.sender,
		    to: req.body.to,
		    cc: req.body.cc,
		    bcc: req.body.bcc,
		    subject: req.body.subject,
		    html: req.body.text
		};
		mailer.sendMail(mail, function(error, info){
		    if(error){
		    		res.send(error);
		        console.log(error);
		    }else{
		    		res.send({success: 'message sent'});
		        console.log('Message sent: ' + info.response);
		    }
		});

		mail._id = shortid.generate();
		mail.type = 'outbox';
		mail.message = {
			subject: req.body.subject,
			text: req.body.text
		};
		var newEmail = new Emails(mail);
		newEmail.save(mail, function (err) {
	  if (err) {console.log(err); res.send(err); return;}
	  	console.log('email saved');
		});
});

/**
* Update user password
* @params{object} old password, new password
* @params{string} success/error
*/
api.post('/api/update-pass', function(req, res){
	Users.find({password: req.body.oldPass}, function(err, user){
		if(err || !user.length){ console.log('user not found', err); res.send(err); return;}
		else{
			Users.update({password: req.body.oldPass}, {password: req.body.newPass},{},
				function(err, result){
					if (err) { console.log('error updating user', err); res.send(err); return;}
			    console.log('user password updated');
			    res.send({ success: 'password updated' });
				});
		}
	});
});

/**
*	delete file
*/
api.post('/api/delete_file', function(req, res){
	fs.unlinkSync('src/public/admin/' + req.body.file, function (err) {
	  if (err) throw err;
	  console.log('successfully deleted ' + req.body.file);
	});
});



//============================================================
/**
* Search services
*/
api.post('/api/search-in-users', function(req, res){
	Users.find({ $or:[
	    { email:{'$regex':req.body.search, $options: 'i' }},
	    { 'name.first':{'$regex':req.body.search, $options: 'i' }},
		  { 'name.last':{'$regex':req.body.search, $options: 'i' }}
	  ]
  	}, function(err, result){
  		if (err) { console.log(err); res.send(err); return;}
  		res.send(result);
    });
});
api.post('/api/search-in-blog', function(req, res){
	// Users.find({ $or:[
 //    { email:{'$regex':req.body.search, $options: 'i' }},
 //    { name: {
	//     	first:{'$regex':req.body.search, $options: 'i' },
	//     	last:{'$regex':req.body.search, $options: 'i' }
 //    }}]
	// }, function(err, result){
	// 	if (err) { console.log(err); res.send(err); return;}
	// 	res.send(result);
 //  });
res.send([]);
});
api.post('/api/search-in-messages', function(req, res){
	Emails.find({ $or:[
    { from:{'$regex':req.body.search, $options: 'i' }},
    { 'to.name':{'$regex':req.body.search, $options: 'i' }},
    { 'to.address':{'$regex':req.body.search, $options: 'i' }},
    { 'message.subject':{'$regex':req.body.search, $options: 'i' }},
	  { 'message.text':{'$regex':req.body.search, $options: 'i' }}
  	]
	}, function(err, result){
		if (err) { console.log(err); res.send(err); return;}
		res.send(result);
  });
});

//==================================================================
//Blog services
api.post('/api/add-blog-post', function(req, res){
	var newPost = new Blog({
			_id         : shortid.generate(),
			userId      : req.body.userId,
			category 	: req.body.category,
			title		: req.body.title,
			content		: req.body.content,
			status		: req.body.status,
			tags		: req.body.tags
		});
	newPost.save(function (err) {
	  if (err) {console.log(err); res.send(err); return;}
	  console.log('post ' + req.body.firstName + 'saved');
	  res.send('blog post added successfully');
	});
});

//upload blog image
api.post('/api/blog-image', function(req, res){
	if(done === true){
		var newImage = new BlogImages({
			_id         : shortid.generate(),
			userId      : req.body.userId,
			imageUrl    : filenameSave,
			name        : req.files.file.originalname,
			value       : filenameSave
		});
		newImage.save(function (err) {
		  if (err) {console.log(err); res.send(err); return;}
		  console.log('image ' + req.files.file.originalname + 'saved');
		  res.send({ data: filenameSave});
		});
	}
});

//get all uploaded blog images
api.get('/api/blog-images', function(req, res){
	BlogImages.find({}, function(error, images){
		console.log(req.headers)
		if (error) {console.log(err); res.send(err); return;}
		res.send({ 'data': images });
	});
});



module.exports = api;