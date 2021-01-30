const express = require("express")
const http = require("http")
const path = require("path")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

const app = express()

// express created server behind the scene, but we need access to it => explicitly created
const server = http.createServer(app)
const io = socketio(server) // set up socket

const port = process.env.PORT || 3000

const publicPath = path.join(__dirname, "../public")

// set up static directory to serve
app.use(express.static(publicPath)); // path.join


// new connection on server
io.on('connection', (socket) => {

    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({
            id: socket.id,
            username,
            room
        })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit("message", generateMessage("Admin", "Welcome!")) //emit to current connection
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined!`)) // emit to all except current
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    })

    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed!")
        }

        const user = getUser(socket.id)
        io.to(user.room).emit("message", generateMessage(user.username, message)) // emit to all
        callback() // event ackowledgement
    })

    socket.on("sendLocation", (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longtitude}`))
        callback()
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left!`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log("Server is up on port " + port);
})