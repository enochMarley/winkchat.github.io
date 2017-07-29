var $showRooms = $('.show-rooms');
var $showUsers = $('.show-users');
var $chatForm = $('.chat-form');
var $messageInput = $('.message-input');
var $showMessage = $('.show-messages-div');
var $messageInpErr = $('.input-error');
var socket = io.connect();
var username = '';
var data = '';

$messageInpErr.html('Wink Inc.').css({"color":"transparent"});

$chatForm.on("submit", (event) => {
    event.preventDefault();
    var message = $messageInput.val();
    socket.emit('newMessage', message, (data) => {
        alert(data);
    });
    $messageInput.val('');
    socket.emit('stoppedTyping');
});

$messageInput.on("input", () => {
    var msg = $messageInput.val();
    if (msg.length > 0) {
        if(msg.substr(0,1) !== '@'){
            socket.emit('notifyTyping', myUsername);
        }else{
            socket.emit('stoppedTyping');
        }
    }else{
        socket.emit('stoppedTyping');
    }
});

socket.on('userTyping', (username) => {
    $messageInpErr.html(username + " is typing...").css({"color":"orange"});
});

socket.on('userStoppedTyping', () => {
    $messageInpErr.html('Wink Chat Inc..').css({"color":"transparent"});
});

socket.on('sendUsername', (username) => {
    myUsername = username;
});

socket.on('newMessage', (message) => {
    showChatMessages(message);
});

socket.on('privateMessage', (message) => {
    showPrivateMessage(message);
});

socket.on('getSentPM', (message) => {
    showSentPrivateMessage(message);
});

socket.on('notifyJoining', (feedback) => {
    showNotifications(feedback);
});

socket.on('notifyRoomMates', (feedback) => {
    showNotifications(feedback);
});

socket.on('notifyRoomChange', (feedback) => {
    showNotifications(feedback);
});

socket.on('notifyOldRoomMates', (feedback) => {
    showNotifications(feedback);
});

socket.on('notifyNewRoomMates', (feedback) => {
    showNotifications(feedback);
});

socket.on('sendGroupPrevMessages', (feedback, groupfd) => {
    $showMessage.empty();
    showNotifications(groupfd);
    for (var i = feedback.length-1; i >= 0; i--) {
        sendPrevGroupMsgs(feedback[i]);
    }
    $showMessage.append('<hr>');
});

socket.on('sendNoGroupPrevMessges', (feedback) => {
    $showMessage.empty();
    showNotifications(feedback);
});

//update the rooms available
socket.on('updateRooms', (rooms, currentRoom) => {
    $showRooms.empty();

    $.each(rooms, (key, value) => {
        if (value == currentRoom) {
            var curGroup = '<div class="not-chooseable room-item">' + value + '</div>';

            $showRooms.append(curGroup);
        } else {
            $showRooms.append('<div class="chooseable-div"><span class="chooseable room-item" onclick="swapRoom(\'' + value + '\')" >' + value + '</span></div>');
        }
    });
});

socket.on('updateUsernames', function(usernames){
    var newUsernameItem = "";
    var nUsernames = usernames.sort();
    for (var i = 0; i < nUsernames.length; i++) {
        var usernameItem = nUsernames[i];
        if (usernameItem == myUsername) {
            newUsernameItem += '<span class="users-item"><i class="fa fa-user"></i> ' + usernameItem + '</span><br>'
        }else{
            newUsernameItem += '<span class="users-item other-users"><i class="fa fa-circle"></i> ' + usernameItem + '</span><br>'
        }
    }
    $showUsers.html(newUsernameItem);
});

function swapRoom(newRoom) {
    socket.emit('swapRoom', newRoom);
}

/*function showUsernames(){
    $(".usernames").toggle("slow");
}*/

function showChatMessages(message){
    var msgSender = message.sender;
    var msg = '';
    if (msgSender == myUsername) {
        msg = '<span class="my-msg"><strong>Me: </strong>' + message.message + '</span><br><br>';
        $showMessage.append(msg);
    }else{
        msg = '<span class="not-my-msg"><strong>' + message.sender + ': </strong>' + message.message + '</span><br><br>';
        $showMessage.append(msg);
    }
    $showMessage.animate({scrollTop:$showMessage.prop("scrollHeight")},1000);
}

function sendPrevGroupMsgs(message){

    var msgSender = message.username;
    var msg = '';
    if (msgSender == myUsername) {
        msg = '<span class="my-msg"><strong>Me: </strong>' + message.message + '</span><br><br>';
        $showMessage.append(msg);
    }else{
        msg = '<span class="not-my-msg"><strong>' + message.username + ': </strong>' + message.message + '</span><br><br>';
        $showMessage.append(msg);
    }
    $showMessage.animate({scrollTop:$showMessage.prop("scrollHeight")},1000);
}


function showPrivateMessage(message){
    msg = '<span class="rec-pm"><strong>PM from ' + message.sender + ': </strong><br>' + message.message + '</span><br><br><br>';
    $showMessage.append(msg);
    $showMessage.animate({scrollTop:$showMessage.prop("scrollHeight")},1000);
}

function showSentPrivateMessage(message){
    msg = '<span class="sent-pm"><strong>PM To ' + message.receiver + ': </strong><br>' + message.message + '</span><br><br><br>';
    $showMessage.append(msg);
    $showMessage.animate({scrollTop:$showMessage.prop("scrollHeight")},1000);
}

function showNotifications(feedback){
    msg = '<p class="notification-msg text-center">' + feedback + '</p><br>';
    $showMessage.append(msg);
    $showMessage.animate({scrollTop:$showMessage.prop("scrollHeight")},1000);
}

function showSideBar(){
    $(".chat-side-nav").css({"width":"100%","z-index":"1999"});
    $(".menu-btn").animate({opacity: '0',},"slow");
}

function hideSideBar(){
    $(".chat-side-nav").css({"width":"0","z-index":"1999"});
    $(".menu-btn").animate({opacity: '1',},"slow");
}