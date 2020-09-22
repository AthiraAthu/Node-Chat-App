const socket=  io()

//Elements

const $messageForm=document.querySelector("#myform")
const $messageInput=$messageForm.querySelector('input')
const $messageButton=$messageForm.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')
const $messages=document.querySelector("#messages")


//Templates

const messageTemplate=document.querySelector("#message-template").innerHTML
const locationTemplate=document.querySelector("#location-template").innerHTML
const sidebarTemplate=document.querySelector("#sidebar-template").innerHTML

//options

const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})//parsing the location.search to onjects and ignoring the ? prefixed at username

const autoscroll = ()=>{
    
    //new message element
    const $newMessage=$messages.lastElementChild
    
    //height of the new message
    const newMessageStyle = getComputedStyle($newMessage)//css properties of the new message,then you can extract the margin from it
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offSetHeight + newMessageMargin
    
    // console.log(newMessageStyle)
    console.log(newMessageMargin)

    //visible height
    const visibleHeight = $messages.offSetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight
    
    //how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }


}
socket.on('message',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{username:message.username,message:message.text,createdAt:moment(message.createdAt).format('h:mm a')}) //render the template using mustache
    $messages.insertAdjacentHTML('beforeend',html) 
    autoscroll()
})
socket.on('locationMessage',(message)=>{
    console.log(message.url)
    const html=Mustache.render(locationTemplate,{username:message.username,url:message.url,createdAt:moment(message.createdAt).format('h:mm a')})
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})
socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{room,users})
    document.querySelector("#sidebar").innerHTML=html

})
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageButton.setAttribute('disabled','disabled')

    var message=e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        $messageButton.removeAttribute('disabled')
        $messageInput.value=''
        $messageInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('The message was delivered')
    })
})
$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position)
        socket.emit('sendLocation',{latitude:position.coords.latitude,longitude:position.coords.longitude},()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
            
        })
    })
})


socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})