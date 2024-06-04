import { useEffect, useRef } from "react";

const Receiver = () => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("https://webrtc-1-rnqa.onrender.com");
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      let pc = pcRef.current;

      if (message.type === "createOffer") {
        console.log("Creating Answer");
        if (pc) {
          pc.close();
        }
        pc = new RTCPeerConnection();
        pcRef.current = pc;

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.send(
              JSON.stringify({
                type: "iceCandidate",
                candidate: event.candidate,
              })
            );
          }
        };

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        pc.onnegotiationneeded = async () => {
          const offer = await pc?.createOffer();
          await pc?.setLocalDescription(offer);
          socket.send(
            JSON.stringify({ type: "offer", sdp: pc?.localDescription })
          );
        };

        await pc.setRemoteDescription(message.sdp);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => pc?.addTrack(track, stream));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(
          JSON.stringify({ type: "createAnswer", sdp: pc.localDescription })
        );
        console.log("Answer sent");
      } else if (message.type === "iceCandidate" && pc) {
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        console.log("Added IceCandidate");
      } else if (message.type === "offer") {
        await pc?.setRemoteDescription(message.sdp);
        const answer = await pc?.createAnswer();
        await pc?.setLocalDescription(answer);
        socket.send(
          JSON.stringify({ type: "createAnswer", sdp: pc?.localDescription })
        );
      }
    };

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div>
      Receiver
      <div>
        <div>
          <label>Local</label>
          <video ref={localVideoRef} autoPlay playsInline></video>
        </div>
        <div>
          <label>Remote</label>
          <video ref={remoteVideoRef} autoPlay playsInline></video>
        </div>
      </div>
    </div>
  );
};

export default Receiver;
