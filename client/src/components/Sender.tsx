import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

interface LocationState {
  state: {
    Id: string;
    userName: string;
  };
}

const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [meetId, setMeetId] = useState<string>("");
  const [remoteUserJoined, setRemoteUserJoined] = useState<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [name, setName] = useState<string>("");
  const [remoteName, setRemoteName] = useState<string>("");
  const location = useLocation();
  const { state } = location as LocationState;

  useEffect(() => {
    if (state) {
      setMeetId(state.Id);
      setName(state.userName);
    }
  }, [state]);

  useEffect(() => {
    if (!meetId || !name) return;

    const socket = new WebSocket("https://webrtc-1-rnqa.onrender.com");
    // const socket = new WebSocket("http://localhost:8080");
    socket.onopen = () => {
      socket.send(
        JSON.stringify({ type: "sender", Id: meetId, userName: name })
      );
    };
    setSocket(socket);

    return () => {
      socket.close();
    };
  }, [meetId, name]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "createAnswer") {
          pc?.setRemoteDescription(data.sdp);
          setRemoteName(data.name);
          setRemoteUserJoined(true);
        }
        if (data.type === "iceCandidate") {
          pc?.addIceCandidate(data.candidate);
        }
        if (data.type === "endCall") {
          endCallHandler();
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, pc]);

  const startSendingVideoHandler = async () => {
    if (!socket) return;

    const pc = new RTCPeerConnection();
    setPc(pc);

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.send(
        JSON.stringify({ type: "createOffer", sdp: pc.localDescription })
      );
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
        );
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    // const stream=localVideoRef.current?.srcObject;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        // setRemoteUserJoined(false);
      }
    };
  };

  const endCallHandler = () => {
    if (pc) {
      pc.close();
      setPc(null);
    }
    if (socket) {
      socket.close();
      setSocket(null);
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
      {!remoteUserJoined && (
        <button
          onClick={startSendingVideoHandler}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        >
          Start Call
        </button>
      )}

      <div className="flex space-x-4">
        <div className="flex flex-col items-center">
          {remoteUserJoined && <label className="text-white mb-2">You</label>}
          <video
            ref={localVideoRef}
            style={{ transform: "scaleX(-1)", width: "30rem", height: "30rem" }}
            className=" "
            autoPlay
          ></video>
        </div>
        {remoteUserJoined && (
          <div className="flex flex-col items-center">
            <label className="text-white mb-2">
              {remoteName ? remoteName : "Other"}
            </label>
            <video
              ref={remoteVideoRef}
              style={{
                transform: "scaleX(-1)",
                width: "30rem",
                height: "30rem",
              }}
              className=" "
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

export default Sender;
