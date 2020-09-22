const path=require('path')
const http=require('http')
const socketio=require('socket.io')
const Filter=require('bad-words')
const express=require('express')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

var app=express()
const server=http.createServer(app)
const io=socketio(server)
const port=process.env.PORT||3000
const publicDirectoryPath=path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{
    console.log('New web socket connection')
    socket.on('join',({username,room},callback)=>{
        const {error,user}=addUser({id:socket.id,username,room})
        if(error){
            return callback(error)

        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined`))
        io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)})
        
        callback()
        
    })
    socket.on('sendMessage',(userMessage,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(userMessage)){
            return callback('Profanity is not allowed')
        }
        
        io.to(user.room).emit('message',generateMessage(user.username,userMessage))
        callback() //to ack the message
    })
    socket.on('sendLocation',(position,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })

    socket.on('disconnect',()=>{ //when a user disconnects
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)})
        }
        
    })
})

server.listen(port,()=>{
    console.log('Server is up on '+port)
})