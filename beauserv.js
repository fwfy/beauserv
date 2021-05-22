// beauserv by Foofy, a NodeJS implementation of Grub4K's "pure batch" chat program server.
// This will probably get ugly fast. Bear with me.

const http = require('http');
const qs = require('querystring');
var sha512 = require('js-sha512');

const version = "v0.0.1 DEV";

var userList = {
    logins: [
        {username:"foofy",password:"d404559f602eab6fd602ac7680dacbfaadd13630335e951f097af3900e9de176b6db28512f2e000b9d04fba5133e8b1c6e8df59db3a8ab9d60be4b97cc9e81db"}
    ]
}

var tokenStore = {}

const requestListener = function (req, res) {
    //console.log(req)
    switch(req.url) {
        case "/":
            res.writeHead(200)
            res.end(`PROTOCOLS:\nBeauserv ${version}\nBatChat v1.0\n\nNOTICE: This page should not be accessed from a browser. Try using a BatChat protocol v1.0 compatible client.`)
            break;
        case "/chatlog":
            res.writeHead(200)
            res.end(JSON.stringify(chatLog))
            break;
        case "/braincells":
            res.writeHead(200)
            res.end(JSON.stringify(tokenStore))
            break;
        case "/login":
            if(req.method !== "POST") {
                res.writeHead(405)
                res.end(`405 Method Not Allowed\n\nYou cannot ${req.method} this resource.\n\nBeauserv ${version}`)
                break;
            } else {
                chunks = []
                req.on('data', chunk => chunks.push(chunk))
                req.on('end', ()=>{
                try{
                    data = qs.parse(Buffer.concat(chunks).toString())
                    allowLogin = false;
                    userList.logins.forEach((e)=>{
                        // remember: e is foreach, data is incoming request
                        if(e.username+":"+e.password == data.username+":"+sha512(data.password)) {
                            allowLogin = true;
                        }
                    })
                    if(allowLogin) {
                        res.writeHead(200)
                        // efficiency is key, so we use the fact that .push() returns what was pushed while also storing it in tokenStore
                        // fuck you comment above this one you're cringe we do things my way now
                        tokenStore[data.username] = {token: sha512("%s:%s",Date.now(),data.username), lastMsg:0}
                        res.end("success\n"+ tokenStore[data.username].token)
                    }
                } catch(e) { console.log("generic error message line 57")}
                })
            }
            break;
        case "/send":
            if(req.method !== "POST") {
                res.writeHead(405)
                res.end(`405 Method Not Allowed\n\nYou cannot ${req.method} this resource.\n\nBeauserv ${version}`)
            } else {
                chunks = []
                req.on('data', chunk => chunks.push(chunk))
                req.on('end', ()=>{
                try{
                    data = qs.parse(Buffer.concat(chunks).toString())
                    // 5:43 PM i have no idea if this code is gonna work
                    // 5:47 PM it somehow did. i am a genius.
                    // 5:48 PM nvm.
                    if(!tokenStore[data.username].token == data.token || typeof tokenStore[data.username].token === "undefined") {
                        res.writeHead(401)
                        res.end(`401 Unauthorized\n\nThe provided token was invalid.\n\nBeauserv ${version}`)
                    } else {
                        chatLog.push({user: data.username, msg: data.message})
                        res.end("success")
                    }
                } catch(e) { console.log("generic error message line 81")}
                })
            }
            break;
            case "/recv":
                if(req.method !== "POST") {
                    res.writeHead(405)
                    res.end(`405 Method Not Allowed\n\nYou cannot ${req.method} this resource.\n\nBeauserv ${version}`)
                } else {
                    chunks = []
                    req.on('data', chunk => chunks.push(chunk))
                    req.on('end', ()=>{
                    try {
                        data = qs.parse(Buffer.concat(chunks).toString())
                        console.log(tokenStore[data.username])
                        if(!tokenStore[data.username].token == data.token || typeof tokenStore[data.username].token === "undefined") {
                            res.writeHead(401)
                            res.end(`401 Unauthorized\n\nThe provided token was invalid.\n\nBeauserv ${version}`)
                        } else {
                            msg = ""
                            if(chatLog[tokenStore[data.username].lastMsg]) {
                                msg = chatLog[tokenStore[data.username].lastMsg].user +":"+ chatLog[tokenStore[data.username].lastMsg].msg
                            } else {
                                msg = ""
                            } 
                            res.end("success\n" + msg + "\nEND")
                            if(tokenStore[data.username].lastMsg < chatLog.length) tokenStore[data.username].lastMsg++; 
                        }
                    } catch(e) { console.log("generic error message line 98 " + e)}
                    })
                }
                break;
        default:
            res.writeHead(404)
            res.end(`404 Not Found\n\nThe requested url could not be found.\n\nBeauserv ${version}`)
    }
}

const server = http.createServer(requestListener);

var chatLog = [{user: "[SERVER]", msg:"Welcome to the server! Currently running Beauserv " + version + "."}];

server.listen(42000)