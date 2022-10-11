const qrcode = require('qrcode')
const express = require('express')
const socketIO = require('socket.io')
const http = require('http')
const { Client, LocalAuth } = require('whatsapp-web.js')
const { ppid } = require('process')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname })
})
const client = new Client({
    authStrategy: new LocalAuth(),
    // puppeteer: {
    //     executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // }
})

client.on('message', async (msg) => {
    console.log(msg.body)
    if (msg.body == '!ping') {
        msg.reply('Pong')
    }

    if (msg.body == 'cok') {
        msg.reply(msg)
    }

    if (msg.body === '!everyone') {
        const chat = await msg.getChat()

        let text = ""
        let mentions = []

        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized) 

            mentions.push(contact)
            text += `@${participant.id.user}\n`
        }

        await chat.sendMessage(text, { mentions })
    }
})

client.initialize()

// Socket IO
io.on('connection', function (socket) {
    socket.emit('message', 'Connecting...')

    client.on('qr', (qr) => {
        // qrcode.generate(qr, { small: true })
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url)
            socket.emit('message', 'QR Code received, scan please')
        })
    })

    client.on('ready', () => {
        socket.emit('ready', 'Whatsapp is ready!')
        socket.emit('message', 'Whatsapp is ready!')
    })

    client.on('authenticated', (session) => {
        socket.emit('ready', 'Whatsapp is authenticated!')
        socket.emit('message', 'Whatsapp is authenticated!')
        console.log('AUTHENTICATED', session)
    })
})

// send message
app.post('/send-message', (req, res) => {
    const number = req.body.number
    const message = req.body.messsage

    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        })
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        })
    })
})

server.listen(8000, function () {
    console.log('App running on ' + 8000)
})