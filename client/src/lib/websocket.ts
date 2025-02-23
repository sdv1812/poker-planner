import { WSMessage } from "@shared/schema";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((msg: WSMessage) => void)[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  connect(sessionId: string) {
    console.log(`Attempting to connect to session: ${sessionId}`);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Closing existing connection before reconnecting');
      this.ws.close();
    }

    this.sessionId = sessionId;
    this.reconnectAttempts = 0;

    return this.attemptConnection();
  }

  private attemptConnection(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?sessionId=${this.sessionId}`;
      console.log(`Connecting to WebSocket URL: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          console.log('Received WebSocket message:', message);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      this.ws.onclose = () => {
        console.log(`WebSocket connection closed. Attempt: ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          console.log(`Attempting to reconnect in ${delay}ms`);

          this.reconnectTimer = setTimeout(() => {
            if (this.sessionId) {
              this.reconnectAttempts++;
              this.attemptConnection();
            }
          }, delay);
        } else {
          console.log('Max reconnection attempts reached');
        }
      };

      this.ws.onopen = () => {
        console.log('WebSocket connection established successfully');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        if (this.reconnectAttempts === 0) {
          reject(err);
        }
      };
    });
  }

  send(message: WSMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      throw new Error("WebSocket not connected");
    }

    const data = JSON.stringify(message);
    console.log('Sending WebSocket message:', message);
    this.ws.send(data);
  }

  onMessage(handler: (msg: WSMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  disconnect() {
    console.log('Disconnecting WebSocket client');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.sessionId = null;
    }
  }
}

export const wsClient = new WebSocketClient();