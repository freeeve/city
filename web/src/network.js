// WebSocket client for City game

export class WebSocketClient {
  constructor() {
    this.ws = null;
    this.handlers = {};
    this.connected = false;
    this.url = null;
  }

  connect(url) {
    this.url = url;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (e) {
        reject(e);
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.ws.close();
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.connected = true;
        resolve();
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };

      this.ws.onclose = () => {
        this.connected = false;
        if (this.handlers['disconnect']) {
          this.handlers['disconnect']();
        }
      };

      this.ws.onmessage = (event) => {
        const lines = event.data.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type && this.handlers[msg.type]) {
              this.handlers[msg.type](msg);
            }
          } catch (e) {
            console.warn('Failed to parse message:', line);
          }
        }
      };
    });
  }

  on(type, handler) {
    this.handlers[type] = handler;
  }

  send(msg) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(msg) + '\n');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}
