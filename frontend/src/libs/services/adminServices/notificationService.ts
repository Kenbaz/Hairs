import { addNotification } from "../../_redux/notificationSlice";
import { store } from "../../_redux/store";
// import { AdminNotification } from "../_redux/types";

class NotificationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  async connect() {
    if (!process.env.NEXT_PUBLIC_WS_URL) {
      console.error("WebSocket URL not configured");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    // Slight delay before attempting connection
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    this.connectionTimeout = setTimeout(() => {
      this.establishConnection(token);
    }, 1000);
  }

  private establishConnection(token: string) {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/admin/dashboard/?token=${token}`;
    console.log("Connecting to WebSocket...");

    try {
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected successfully");
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
        this.startKeepAlive();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "notification":
              store.dispatch(addNotification(data.data));
              break;
            case "stats_update":
              console.log("Received stats update:", data.data);
              break;
            case "error":
              console.error("Received error:", data.message);
              break;
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        this.stopKeepAlive();
        if (!event.wasClean) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      this.attemptReconnect();
    }
  }

  private startKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts);
      console.log(
        `Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts + 1}/${
          this.maxReconnectAttempts
        })`
      );

      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.log("Max reconnection attempts reached");
    }
  }

  disconnect() {
    this.stopKeepAlive();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const notificationService = new NotificationService();
