var net     = require('net')
var sockets = {}

var server = net.createServer(function (socket) {
  var id = socket.remoteAddress + ':' + socket.remotePort
  sockets[id] = socket

  socket.on('end', function () {
    delete sockets[id]
  })

  socket.on('data', function (data) {
    msg('<' + id + '> ' + data)
  })

  socket.on('error', console.error)

  msg('* ' + id + ' joined the chat')
})

function msg (m) {
  Object.keys(sockets).forEach(function (peer) {
    try {
      sockets[peer].write(m.replace(/(\r\n)+/g, '') + '\n')
    } catch (e) {}
  })
}

server.listen(1338)