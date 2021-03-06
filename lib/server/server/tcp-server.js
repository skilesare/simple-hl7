var events = require('events');
var Parser = require('../../hl7/parser.js');
var Message = require('../../hl7/message.js');
var moment = require('moment');
var net    = require('net');
var util   = require('util');


var VT = String.fromCharCode(0x0b);
var FS = String.fromCharCode(0x1c);
var CR = String.fromCharCode(0x0d);

function TcpServer() {
  events.EventEmitter.call(this);

  this.server = null;
  this.parser = new Parser();
}

util.inherits(TcpServer, events.EventEmitter);

TcpServer.prototype.start = function(port) {
  var tcpServer = this;
  this.server = net.createServer(function(socket) {

    socket.on('data', function(data) {
      try {
        var msg = tcpServer.parser.parse(data.toString().substring(1, data.toString().length - 3));
        var ack = tcpServer.createAckMessage(msg);
        socket.write(VT + ack + FS + CR);
        tcpServer.emit('msg', msg)
      }
      catch (err) {
        throw err;
      }
    });


});

  this.server.listen(port);
}

TcpServer.prototype.createAckMessage = function(msg) {
  var ack = new Message(
                        msg.header.getField(3),
                        msg.header.getField(4),
                        msg.header.getField(1),
                        msg.header.getField(2),
                        moment().format('YYYYMMDDHHmmss'),
                        '',
                        ["ACK"],
                        'ACK' + moment().format('YYYYMMDDHHmmss'),
                        'P',
                        '2.3')

  ack.addSegment("MSA", "AA", msg.header.getField(8))

  return ack.toString();

}


module.exports = TcpServer;
