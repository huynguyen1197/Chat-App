const socket = io()

const $messageForm = document.querySelector("#sendMes")
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector("button")
const $locationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector("#sidebar")
//TEmplates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sideBarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}


socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users,
    })
    $sidebar.innerHTML = html

})


socket.on("locationMessage", (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("hh:mm A")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on("message", (message) => {

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("hh:mm A")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute("disabled", 'disabled')

    const message = $messageFormInput.value

    // add function to event ackowledge
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return alert(error);
        }
    })
})

$locationButton.addEventListener("click", (e) => {

    // check if geolocation API is supported
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.")
    }

    $locationButton.setAttribute("disabled", "disabled")

    // async but do not support promise => pass callback function
    navigator.geolocation.getCurrentPosition((location) => {
        socket.emit("sendLocation", {
            latitude: location.coords.latitude,
            longtitude: location.coords.longitude
        }, () => {
            $locationButton.removeAttribute("disabled")
        })
    })
})

socket.emit('join', {
    username,
    room
}, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})