import { WSMessage } from "@shared/schema";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((msg: WSMessage) => void)[] = [];

  connect(sessionId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/socket?sessionId=${sessionId}`;

    this.ws = new WebSocket(wsUrl);

    return new Promise<void>((resolve, reject) => {
      if (!this.ws) return reject(new Error("WebSocket not initialized"));

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          this.messageHandlers.forEach(handler => handler(message));
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      };

      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });
  }

  send(message: WSMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    this.ws.send(JSON.stringify(message));
  }

  onMessage(handler: (msg: WSMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();