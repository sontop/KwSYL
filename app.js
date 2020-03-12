var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var os = require('os');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var chatRouter = require('./routes/chat');
var RtcRouter = require('./routes/Rtc');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/chat',chatRouter);
app.use('/Rtc',RtcRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//socket 설정
app.io = require('socket.io')();

app.io.on('connection', function(socket){

      function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
      }

      socket.on('message', function(message) {
        log('Client said: ', message);
        console.log('Client said: ',message); //message에 sdp나 Type이 들어가게 된다. Candidate가 들어감.
        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message); //나를 제외하고 전체에게 채팅을 보내는 것.
      });

  socket.on('create or join',function(room){
      log('Received request to create of join room ' + room);
      var clientsInRoom = app.io.sockets.adapter.rooms[room];
      console.log(clientsInRoom);
      var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length :0;
    console.log(numClients);
      log('Room: ' + room + ' now has ' + numClients + ' client(s) ');

    if(numClients === 0){
      socket.join(room);
     log('Client ID : ' + socket.id + ' _Create Room_ ' + room);
      app.io.emit('created' ,room,socket.id);

    }
    else if(numClients === 1){
      log('Client2 ID : ' + socket.id + ' _joined room_ ' + room);
      app.io.sockets.in(room).emit('join'.room);
      socket.join(room);
      app.io.emit('joined',room,socket.id);
      app.io.sockets.in(room).emit('Ready');
      log('ready: ' + room);
    }
    else{
      app.io.emit('full',room);
    }
  });

    socket.on('ipaddr',function(){
      var ifaces = os.networkInterfaces();
      for(var dev in ifaces){
        ifaces[dev].forEach(function(details){
          if(details.family === 'IPv4' && details.address !== '127.0.0.1'){
            socket.emit('ipaddr',details.address);
          }
        });
      }
    });
    socket.on('bye',function(){
      log('Received Bye');
    });

  socket.on('disconnect', function(){
    log('user disconnected ' + socket.id);
  });

  socket.on('chatMessage', function(msg){
    log('message: ' + msg + ' Id :' + socket.id);
    app.io.emit('chatMessage', msg);
  });
});

module.exports = app;