/**
	Created By Enoch Marley [24/07/2017]
*/
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var server =  require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');
var mongoose = require('mongoose');
var port = 3000;
var appUser = "";
var usernames = {};
var availableRooms = ['General','Computing','Entertainment','Fashion','Health','Relationship'];
var sessionMiddleware = session({secret: 'secretkey'});
/*var roomsAndUsernames = {};
var createdRoomsAndUsernames = {
	'General': [],
	'Computing': [],
	'Entertainment': [],
	'Fashion': [],
	'Health': [],
	'Relationship': []
};*/

//mongodb db setup
var mongoDbUrl = "mongodb://winkchat:winkchat@ds149122.mlab.com:49122/winkchat";
//var mongoDbUrl = 'mongodb://127.0.0.1/WinkChat';
mongoose.connect(mongoDbUrl, function(error){
	if (error) {
		console.log(error)
	}else{
		console.log('mongodb connected')
	}
});

var usersSchema = mongoose.Schema({
	username: String,
	userPassword: String,
	dateCreated: {type: Date,default: Date.now}
});

var user = mongoose.model('user', usersSchema);

var chatSchema = mongoose.Schema({
	username: String,
	message: String,
	group: String,
	timeSent: {type: Date,default: Date.now}
});

var chat = mongoose.model('message', chatSchema);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//user body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//use session
app.use(sessionMiddleware);
io.use((socket,next) => {
	sessionMiddleware(socket.request, socket.request.res, next)
});

//use static files
app.use(express.static(path.join(__dirname, 'public')));

//listen on server
server.listen(port);

//initializing session variable
var appSession;

//when the index page is requested
app.get('/', (req,res) => {
	appSession = req.session;
	if (appSession.loggedIn) {
		res.redirect('/chatroom');
	}else{
		res.render('index',{title:'Wink'});
	}
	
});

//when the login page is requested
app.get('/login', (req,res) => {
	appSession = req.session;
	if (appSession.loggedIn) {
		res.redirect('/chatroom');
	}else{
		res.render('login',{title:'Wink'});
	}
});

//when the signup page is requested
app.get('/signup', (req,res) => {
	appSession = req.session;
	if (appSession.loggedIn) {
		res.redirect('/chatroom');
	}else{
		res.render('signup',{title:'Wink'});
	}
});

//when the signup page is requested
app.get('/chatroom', (req,res) => {
	appSession = req.session;
	if (!appSession.loggedIn) {
		res.redirect('/login');
	}else{
		appUser = appSession.username;
		res.render('chatrooms',{title:'Wink'});
	}
	
});

//checking if username is availabel
app.post('/checkUsername', (req,res) => {
	var username = req.body.username;
	user.find({username:username}, (error, doc) =>{
		if (error) {
			console.log(error)
		}else{
			if (doc.length <= 0) {
				res.send(false);
			}else{
				res.send(true);
			}
		}
	});
	
});

//signing up a user
app.post('/signupuser', (req,res) => {
	var username = req.body.username;
	var password = req.body.password;
	var signupuser = new user({username: username,userPassword:password});
	signupuser.save( (error) => {
		if (error) {
			res.send(false);
			console.log(error);
		}else{
			res.send(true);
		}
	});
	
});

//logging in a user
app.post('/loginuser', (req,res) => {
	appSession = req.session;
	var username = req.body.username;
	var password = req.body.password;

	user.find({username:username,userPassword:password}, (error, doc) =>{
		if (error) {
			console.log(error)
		}else{
			if (doc.length <= 0) {
				res.send(false);
			}else{
				appSession.username = doc[0].username;
				appSession.loggedIn = true;
				res.send(true);
			}
		}
		
	});
	
});

//socket programming
io.sockets.on('connection',(socket) => {
	var sesss = socket.request.session;
	var appUser = sesss.username;

	socket.username = appUser; //set the socket username of the current user
	socket.room = 'General'; //set the room of the current user
	usernames[socket.username] = socket; //add the user to the usernames 
	socket.join('General'); //join the user to the current room
	socket.emit('notifyJoining','You have Joined The ' + 'General' + ' Room');
	socket.broadcast.to('General').emit('notifyRoomMates', socket.username + ' Has Joined This Room');
	socket.emit('updateRooms',availableRooms,'General');
	socket.emit('sendUsername',socket.username);
	sendPrevGroupMessages(socket.room);
	updateUsernames();

	socket.on('newMessage', (message, callback) => {
		var newMsg = message.trim();
		if(newMsg.substr(0,1) === '@'){
			newMsg = newMsg.substr(1);
			var spaceInd = newMsg.indexOf(' ');
			if (spaceInd !== -1) {
				var name = newMsg.substr(0,spaceInd).trim();
				var pmMsg = newMsg.substr(spaceInd + 1);
				if (name in usernames) {
					if (name == socket.username) {
						callback('Sorry, You Cannot Send A Message To Yourself');
					} else {
						//if (socket.rooms[socket.room]) {
							usernames[name].emit('privateMessage', {message:newMsg,sender: socket.username});
							socket.emit('getSentPM', {message: newMsg,sender: 'Me', receiver: name});
						//}else{
							//callback('You Can Only PM Users In "' + socket.room + '" Chat room');
						//}
					}
				}else{
					callback('Please Enter A Valid Username');
				}

			}else{
				callback('Please Enter A message To Your PM')
			}
		}else{
			var saveMsg = new chat({username:socket.username,message: newMsg,group:socket.room});

			saveMsg.save(function(error){
				if (error) {
					throw error;
				}else{
					io.sockets.in(socket.room).emit('newMessage', {message:newMsg,sender: socket.username});
				}
			})
			
		}
		
	});

	socket.on('notifyTyping', (username) => {
		socket.broadcast.emit('userTyping', username);
	});

	socket.on('stoppedTyping', () => {
		socket.broadcast.emit('userStoppedTyping');
	});

	socket.on('swapRoom', (newRoom) => {
		socket.leave(socket.room); //leave current room
		socket.join(newRoom);
		socket.emit('notifyRoomChange','You Have Left ' + socket.room + ' And Have Joined ' + newRoom);
		socket.broadcast.to(socket.room).emit('notifyOldRoomMates', socket.username + " Has Left This Room");
		socket.room = newRoom;
		socket.broadcast.to(newRoom).emit('notifyNewRoomMates', socket.username + " Has Joined This Room");
		socket.emit('updateRooms',availableRooms,newRoom);
		sendPrevGroupMessages(newRoom);
	});

	socket.on('disconnect', () => {
		delete usernames[socket.username];
		socket.broadcast.emit('updateAllUsers', socket.username + ' Has Disconnected');
		socket.leave(socket.room);
		updateUsernames();
	});


	function sendPrevGroupMessages(groupName){
		var groupPrevMsg = chat.find({group:groupName});
		groupPrevMsg.sort('-timeSent').limit(8).exec( (error, messages) =>{
			if (error) {
				throw error
			}else{
				//console.log('sending prev messages');
				//console.log(messages)
				if (messages.length > 0) {
					socket.emit('sendGroupPrevMessages', messages,'You Have Changed Room To ' + groupName +
				 	'.<br>Chat History Of This Group');
				}else{
					socket.emit('sendNoGroupPrevMessges', 'You Have Changed To ' + groupName + '.<br>There Is No Chat History Available');
				}
				
			}
		});
	}

	function updateUsernames(){
		io.sockets.emit('updateUsernames', Object.keys(usernames));
	}
	
});


//if there is an error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err.stack);

});