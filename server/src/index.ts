import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface Room {
  senderSocket: WebSocket;
  senderName: string;
  receiverSocket: WebSocket | null;
  receiverName: string | null;
}

const rooms: Record<string, Room> = {};

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data: any) {
    const message = JSON.parse(data);

    if (message.type === "sender") {
      const { Id, userName } = message;
      console.log("Id from " + userName + " Is " + Id);
      rooms[Id] = {
        senderSocket: ws,
        senderName: userName,
        receiverSocket: null,
        receiverName: null,
      };
    } else if (message.type === "receiver") {
      const { Id, userName } = message;
      console.log("Id from " + userName + " Is " + Id);
      const room = rooms[Id];
      if (room) {
        room.receiverSocket = ws;
        room.receiverName = userName;

        
        room.senderSocket.send(
          JSON.stringify({
            type: "remoteName",
            name: userName,
          })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "No such meeting exists.",
          })
        );
        return;
      }
    } else if (message.type === "createOffer") {
      const room = Object.values(rooms).find(
        (room) => room.senderSocket === ws
      );
      if (!room) return;

      room.receiverSocket?.send(
        JSON.stringify({
          type: "createOffer",
          sdp: message.sdp,
          name: room.senderName,
        })
      );
    } else if (message.type === "createAnswer") {
      const room = Object.values(rooms).find(
        (room) => room.receiverSocket === ws
      );
      if (!room) return;

      room.senderSocket?.send(
        JSON.stringify({
          type: "createAnswer",
          sdp: message.sdp,
          name: room.receiverName,
        })
      );
    } else if (message.type === "iceCandidate") {
      const room = Object.values(rooms).find(
        (room) => room.senderSocket === ws || room.receiverSocket === ws
      );
      if (!room) return;

      if (ws === room.senderSocket) {
        room.receiverSocket?.send(
          JSON.stringify({ type: "iceCandidate", candidate: message.candidate })
        );
      } else if (ws === room.receiverSocket) {
        room.senderSocket?.send(
          JSON.stringify({ type: "iceCandidate", candidate: message.candidate })
        );
      }
    }
  });
});
