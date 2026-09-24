import { io } from 'socket.io-client';

// Detect server target:
// If running on Vite dev server (e.g. localhost:5173), point to backend on port 3000.
// If served by Express in production, use origin.
const getDefaultServerUrl = () => {
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    if (port === '5173' || port === '5174') {
      return `${protocol}//${hostname}:3000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

class SocketClient {
  constructor() {
    this.socket = null;
    this.serverUrl = getDefaultServerUrl();
    this.latencyMs = null;
    this.pingTimer = null;
    this.listeners = new Map();
  }

  init(customUrl) {
    if (customUrl) {
      this.serverUrl = customUrl;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Admin Portal connected to server:', this.serverUrl);
      this._startPing();
      this._emit('status_change', { connected: true, serverUrl: this.serverUrl });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Admin Portal disconnected from server');
      this._stopPing();
      this.latencyMs = null;
      this._emit('status_change', { connected: false, serverUrl: this.serverUrl });
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ Admin Portal connection error:', err.message);
      this._emit('status_change', { connected: false, error: err.message });
    });

    this.socket.on('latency_pong', (data) => {
      if (data && typeof data.clientTimestamp === 'number') {
        this.latencyMs = Date.now() - data.clientTimestamp;
        this._emit('latency_update', this.latencyMs);
      }
    });

    return this.socket;
  }

  _startPing() {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        const sendTime = Date.now();
        this.socket.emit('latency_ping', sendTime, (response) => {
          if (response && response.clientTimestamp) {
            this.latencyMs = Date.now() - response.clientTimestamp;
            this._emit('latency_update', this.latencyMs);
          }
        });
      }
    }, 4000);
  }

  _stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Also register on underlying socket if active
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  emit(event, data) {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        return resolve({ success: false, error: 'Socket not connected' });
      }
      this.socket.emit(event, data, (response) => {
        resolve(response || { success: true });
      });
    });
  }
}

export const socketService = new SocketClient();
