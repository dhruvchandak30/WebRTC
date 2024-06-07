"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const rooms = {};
wss.on("connection", function connection(ws) {
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
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
        }
        else if (message.type === "receiver") {
            const { Id, userName } = message;
            console.log("Id from " + userName + " Is " + Id);
            const room = rooms[Id];
            if (room) {
                room.receiverSocket = ws;
                room.receiverName = userName;
                room.senderSocket.send(JSON.stringify({
                    type: "remoteName",
                    name: userName,
                }));
            }
            else {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "No such meeting exists.",
                }));
                return;
            }
        }
        else if (message.type === "createOffer") {
            const room = Object.values(rooms).find((room) => room.senderSocket === ws);
            if (!room)
                return;
            (_a = room.receiverSocket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                type: "createOffer",
                sdp: message.sdp,
                name: room.senderName,
            }));
        }
        else if (message.type === "createAnswer") {
            const room = Object.values(rooms).find((room) => room.receiverSocket === ws);
            if (!room)
                return;
            (_b = room.senderSocket) === null || _b === void 0 ? void 0 : _b.send(JSON.stringify({
                type: "createAnswer",
                sdp: message.sdp,
                name: room.receiverName,
            }));
        }
        else if (message.type === "iceCandidate") {
            const room = Object.values(rooms).find((room) => room.senderSocket === ws || room.receiverSocket === ws);
            if (!room)
                return;
            if (ws === room.senderSocket) {
                (_c = room.receiverSocket) === null || _c === void 0 ? void 0 : _c.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
            else if (ws === room.receiverSocket) {
                (_d = room.senderSocket) === null || _d === void 0 ? void 0 : _d.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
        }
        else if (message.type === "startCamera") {
            const room = Object.values(rooms).find((room) => room.senderSocket === ws || room.receiverSocket === ws);
            if (!room)
                return;
            if (ws === room.senderSocket) {
                (_e = room.receiverSocket) === null || _e === void 0 ? void 0 : _e.send(JSON.stringify({ type: "startCamera" }));
            }
            else if (ws === room.receiverSocket) {
                (_f = room.senderSocket) === null || _f === void 0 ? void 0 : _f.send(JSON.stringify({ type: "startCamera" }));
            }
        }
        else if (message.type === "cameraClosed") {
            const room = Object.values(rooms).find((room) => room.senderSocket === ws || room.receiverSocket === ws);
            if (!room)
                return;
            if (ws === room.senderSocket) {
                (_g = room.receiverSocket) === null || _g === void 0 ? void 0 : _g.send(JSON.stringify({ type: "cameraClosed" }));
            }
            else if (ws === room.receiverSocket) {
                (_h = room.senderSocket) === null || _h === void 0 ? void 0 : _h.send(JSON.stringify({ type: "cameraClosed" }));
            }
        }
    });
});
