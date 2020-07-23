var socket;
var username;
var contentChat = [];
var connected = [];
var result;

function connect(name){
    if(name == username)return;
    console.log(connected);
    let connect = connected.find(x => x == name);
    if( connect != null || connect != undefined){
        alert('Bạn đã kết nối với '+name+'.');
        return;
    }
    socket.emit('request-connect', name);
}
function sendMessage(roomName){
    let id = '#chat-' + roomName;
    let input = $(id);
    socket.emit('request-chat', {Username: username, Content: input.val(), RoomName:  roomName });
    input.val('');
}

$(document).ready(() => {
    $("#btn-login").click(() => {
        username = $("#username").val();
        if(username == '' || username == null || username == undefined){
            alert("Tên đăng nhập không được để trống!");
            return;
        }
        if ( username.includes(' ')) {
            alert("Tên đăng nhập không được có khoảngs trống!");
            return;
        }
        $.ajax({url :"https://vuongnv-chat.herokuapp.com//sign-in",
                method: "post",
                data:{username: username}
                }).done((res) => {
                    if(res.status){
                        $('#login').css('display','none');
                        $('#login-success').css('display','block');
                        $('#d-username').html(username);
                        socket = io("https://vuongnv-chat.herokuapp.com");
                        socket.emit("username",username);
                        socket.on("users", (data) => {
                            var table = $("#users");
                            var content = '';
                            data.forEach(item => {
                                if(item.username == username)   return;
                                var online = item.isOnline ? "bg-success": "bg-secondary";
                                content +=`<tr>
                                    <td>${item.username}</td>
                                    <td>
                                        <div style="width:15px;height: 15px; border-radius: 50%" class="${online}"></div>
                                    </td>
                                    <td><button class="btn-send-message" onclick="connect('${item.username}')">Click</button></td>
                                </tr>`;
                            });
                            table.html(content);
                        });
                        init();

                    }
                    else{
                        alert(res.message);
                    }
                });
    });
    
    let init = () => {
        socket.on("await-connect", data => {
            roomName = data.room;
            createDialogConfirm(data.name + ' muốn kết nối !',data, roomName)
        })
        socket.on("my-conversation", data => {
            let element = $('#'+data.roomName);
            let style = data.username == username? 'is-me' : 'is-friend';
            let content = `
                <div>
                    <div class="${style}">
                        <span style="font-size: small; margin-bottom: 5px; display: block; color:#7b6c6c">${data.username}</span>
                        <span class="content content-bg">${data.content}</span>
                    </div>
                    <div class="clearfix"></div>
                </div>
            `;
            element.append(content);
            $("."+data.roomName).animate({ scrollTop: $("."+data.roomName).height() }, 100);
        })
        socket.on('connect-success', (data) => {
            console.log(data);
            let chat = {friend: data.friend, roomName: data.roomName };
            contentChat.push(chat);
            connected.push(data.friend);
            connected.push(data.username);
            let parent = $('.users-chat');
            let title = data.friend == username? data.username : data.friend;
            let chatbox = `
                <div class="chat-box">
                    <div class="chat-box-header">
                        <p class="title">${title}</p>
                    </div>
                    <div class="chat-box-content ${data.roomName}">
                        <div id="${data.roomName}"></div>
                    </div>
                    <div class="chat-box-footer">
                        <div class="txt-input p-2">
                                <input type="text" class="txt" id="chat-${data.roomName}"/>
                        </div>
                        <div class="submit p-2">
                            <button class="btn-send-message" onclick="sendMessage('${data.roomName}')">OK</button>
                        </div>
                    </div>
                </div>
            `;
            parent.append(chatbox);
           
        });
        socket.on('rejected-connect', data => {
            alert(data.friend +' từ chối kết nối!');
        });
    };
    let createDialogConfirm =  async (message,data, roomName) => {
        let dialog = `
            <div class="dialog-confirm">
                <p>${message}</p>
                <div class="float-right">
                    <button class="btn btn-light" onclick="socket.emit('reject-connect',{username: '${username}', friend: '${data.name}'});$('.dialog-confirm').remove(); ">Hủy</button>
                    <button class="btn btn-primary" onclick="socket.emit('accept-connect',{friend: '${data.name}', room: '${roomName}'});$('.dialog-confirm').remove();">Đồng ý</button>
                </div>
            </div>
        `;
        $('body').append(dialog);
    }
    
})
