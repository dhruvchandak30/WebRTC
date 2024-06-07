import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface LocationState {
  state: {
    Id: string;
    userName: string;
  };
}

const Receiver = () => {
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [meetId, setMeetId] = useState<string | null>(null);
  const [remoteName, setRemoteName] = useState<string>("");
  const [remoteUserJoined, setRemoteUserJoined] = useState<boolean>(false);
  const location = useLocation();
  const { state } = location as LocationState;
  const [message, setMessage] = useState("");
  const [remoteCamera, setRemoteCamera] = useState(true);
  const [stream, setStream] = useState<unknown>(null);

  useEffect(() => {
    if (state) {
      setMeetId(state.Id);
    }
  }, [state]);

  useEffect(() => {
    // const socket = new WebSocket("https://webrtc-1-rnqa.onrender.com");
    const socket = new WebSocket("http://localhost:8080");
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
            setRemoteCamera(true);
            console.log("Inside Remote.currect");
          }
          console.log("Addoing Remote Track");
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
          audio: true,
        });
        setStream(stream);

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
      } else if (message.type === "error") {
        setMessage(message.message);
      } else if (message.type === "cameraClosed") {
        remoteVideoRef.current = null;
        setRemoteCamera(false);
        console.log("Recvd Stop Camera Call");
      } else if (message.type === "startCamera") {
        console.log("Recv Start Camera");
        setRemoteCamera(true);
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

  const StopCameraHandler = () => {
    if (stream && pcRef.current) {
      const pc = pcRef.current;
      socketRef.current?.send(JSON.stringify({ type: "cameraClosed" }));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      stream.getTracks().forEach((track) => {
        track.stop();
        const sender = pc.getSenders().find((sender) => sender.track === track);
        if (sender) {
          pc.removeTrack(sender);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      setStream(null);
    }
  };

  const StartCameraHandler = async () => {
    if (pcRef.current) {
      socketRef.current?.send(JSON.stringify({ type: "startCamera" }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream
        .getTracks()
        .forEach((track) => pcRef.current?.addTrack(track, stream));
      setStream(stream);
    }
  };

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
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700 space-y-4">
      <div className="flex space-x-4">
        {!remoteUserJoined && !message && (
          <label className="text-white">Waiting for owner to let you In</label>
        )}
        <div className="flex flex-col items-center">
          <video
            style={{ transform: "scaleX(-1)", width: "40rem", height: "30rem" }}
            ref={localVideoRef}
            autoPlay
          ></video>
          {remoteUserJoined && <label className="text-white mb-2">You</label>}
        </div>
        {remoteCamera && (
          <div className="flex flex-col items-center">
            <video
              style={{
                transform: "scaleX(-1)",
                width: "40rem",
                height: "30rem",
              }}
              ref={remoteVideoRef}
              autoPlay
            ></video>

            <label className="text-white mb-2">
              {remoteName ? remoteName : "Other"}
            </label>
          </div>
        )}
      </div>
      <div className="flex flex-col md:flex-row md:gap-8 items-center">
        <div className="flex flex-row gap-8">
          <div onClick={StartCameraHandler}>Start Camera</div>
          <div onClick={StopCameraHandler}>Stop Camera</div>
        </div>
        <div>
          {remoteUserJoined && (
            <button
              onClick={endCallHandler}
              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
            >
              END CALL
            </button>
          )}
        </div>
      </div>
      {message && (
        <div className="flex flex-col text-center">
          <label className="text-red-700 font-bold text-3xl">{message}</label>
          <Link to="/" className="text-white text-3xl">
            Go Back
          </Link>
        </div>
      )}
    </div>
  );
};

export default Receiver;
