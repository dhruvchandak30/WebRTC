import React, { useEffect, useState, useRef } from "react";

const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "sender" }));
    };
    setSocket(socket);

    // Cleanup on component unmount
    return () => {
      socket.close();
    };
  }, []);

  const startSendingVideoHandler = async () => {
    if (!socket) return;
    console.log("Inside Sending Video");

    const pc = new RTCPeerConnection();

    pc.onnegotiationneeded = async () => {
      console.log("Negotiated");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.send(
        JSON.stringify({ type: "createOffer", sdp: pc.localDescription })
      );
    };
    pc.onicecandidate = (event) => {
      console.log("Ice Candidate");
      if (event.candidate) {
        socket.send(
          JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
        );
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "createAnswer") {
        pc.setRemoteDescription(data.sdp);
        console.log("Create Answer set remote Desc");
      }
      if (data.type === "iceCandidate") {
        console.log("Added IceCandidates");
        pc.addIceCandidate(data.candidate);
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      console.log("Receiver", event);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = new MediaStream([event.track]);
      }
    };
  };

  return (
    <div>
      Sender
      <div onClick={startSendingVideoHandler}>Send Video</div>
      <div>
        <div>
          <label>Local</label>
          <video ref={localVideoRef} autoPlay></video>
        </div>
        <div>
          <label>Remote</label>
          <video ref={remoteVideoRef} autoPlay></video>
        </div>
      </div>
    </div>
  );
};

export default Sender;
