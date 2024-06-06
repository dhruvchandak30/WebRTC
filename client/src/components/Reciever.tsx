import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

interface LocationState {
  state: {
    Id: string;
    userName: string;
  };
}

const Receiver = () => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [meetId, setMeetId] = useState<string | null>(null);
  const [remoteName, setRemoteName] = useState<string>("");
  const [remoteUserJoined, setRemoteUserJoined] = useState<boolean>(false);
  const location = useLocation();
  const { state } = location as LocationState;

  useEffect(() => {
    if (state) {
      setMeetId(state.Id);

      console.log("Got User Name", state.userName);
    }
  }, [state]);

  useEffect(() => {
    const socket = new WebSocket("https://webrtc-1-rnqa.onrender.com");

    // const socket = new WebSocket("http://localhost:8080");
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "receiver",
          Id: meetId,
          userName: state.userName,
        })
      );
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      let pc = pcRef.current;

      if (message.type === "createOffer") {
        console.log("Creating Answer");
        setRemoteName(message.name);
        setRemoteUserJoined(true);
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
  }, [meetId, state.userName]);

  const endCallHandler = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: "endCall" }));
      socketRef.current.close();
      socketRef.current = null;
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    setRemoteUserJoined(false);
    setRemoteName("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700 space-y-4">
      <div className="flex space-x-4">
        <div className="flex flex-col items-center">
          {!remoteUserJoined && (
            <label className="text-white">
              Waiting for owner to Start the Call
            </label>
          )}
          {remoteUserJoined && <label className="text-white mb-2">You</label>}
          <video
            style={{ transform: "scaleX(-1)", width: "30rem", height: "30rem" }}
            ref={localVideoRef}
            autoPlay
          ></video>
        </div>
        {remoteUserJoined && (
          <div className="flex flex-col items-center">
            <label className="text-white mb-2">
              {remoteName ? remoteName : "Other"}
            </label>
            <video
              style={{
                transform: "scaleX(-1)",
                width: "30rem",
                height: "30rem",
              }}
              ref={remoteVideoRef}
              autoPlay
            ></video>
          </div>
        )}
      </div>
      {remoteUserJoined && (
        <button
          onClick={endCallHandler}
          className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
        >
          END CALL
        </button>
      )}
    </div>
  );
};

export default Receiver;
