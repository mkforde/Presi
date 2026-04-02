'use strict';

const net = require('net');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

function getSocketPath(filePath) {
  const abs = path.resolve(filePath);
  const hash = crypto.createHash('md5').update(abs).digest('hex').slice(0, 8);
  return `/tmp/presi-${hash}.sock`;
}

// Server side: main presentation creates and manages this
class SyncServer {
  constructor(socketPath, onSlide) {
    this.socketPath = socketPath;
    this.clients = new Set();
    this.currentIndex = 0;
    this.server = null;
    this.onSlide = onSlide; // called when speaker pushes a nav change
  }

  start() {
    // Remove stale socket if it exists
    try { fs.unlinkSync(this.socketPath); } catch (_) {}

    this.server = net.createServer((socket) => {
      this.clients.add(socket);
      let buf = '';

      // Send current state immediately on connect
      this._send(socket, { type: 'slide', index: this.currentIndex });

      // Accept nav pushes FROM clients (speaker controlling main)
      socket.on('data', (data) => {
        buf += data.toString();
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === 'slide' && typeof msg.index === 'number') {
              if (this.onSlide) this.onSlide(msg.index);
            }
          } catch (_) {}
        }
      });

      socket.on('close', () => this.clients.delete(socket));
      socket.on('error', () => this.clients.delete(socket));
    });

    this.server.listen(this.socketPath);
    this.server.on('error', () => {}); // silently handle errors

    // Cleanup on exit
    process.on('exit', () => this._cleanup());
    process.on('SIGINT', () => { this._cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { this._cleanup(); process.exit(0); });
  }

  broadcast(index) {
    this.currentIndex = index;
    const msg = { type: 'slide', index };
    for (const client of this.clients) {
      this._send(client, msg);
    }
  }

  _send(socket, obj) {
    try {
      socket.write(JSON.stringify(obj) + '\n');
    } catch (_) {}
  }

  _cleanup() {
    try { this.server && this.server.close(); } catch (_) {}
    try { fs.unlinkSync(this.socketPath); } catch (_) {}
  }
}

// Client side: speaker notes connects to main presentation
class SyncClient {
  constructor(socketPath, onSlide) {
    this.socketPath = socketPath;
    this.onSlide = onSlide;
    this.socket = null;
    this.buffer = '';
    this.connected = false;
  }

  connect(onConnect, onError) {
    this.socket = net.createConnection(this.socketPath, () => {
      this.connected = true;
      if (onConnect) onConnect();
    });

    this.socket.on('data', (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop(); // keep incomplete line
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.type === 'slide') this.onSlide(msg.index);
        } catch (_) {}
      }
    });

    this.socket.on('error', (err) => {
      this.connected = false;
      if (onError) onError(err);
    });

    this.socket.on('close', () => {
      this.connected = false;
    });
  }

  send(obj) {
    if (this.socket && this.connected) {
      try { this.socket.write(JSON.stringify(obj) + '\n'); } catch (_) {}
    }
  }

  disconnect() {
    try { this.socket && this.socket.destroy(); } catch (_) {}
  }
}

module.exports = { getSocketPath, SyncServer, SyncClient };
