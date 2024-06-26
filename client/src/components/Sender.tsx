import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import startCamera from "../assets/startCamera.png";
import stopCamera from "../assets/stopCamera.png";
import offCamera from "../assets/offCameraIcon.png";
import MeetIdComponent from "./MeetIdComponent";

interface LocationState {
  state: {
    Id: string;
    userName: string;
  };
}

const Sender = () => {
  const navigate = useNavigate();
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

  const [message, setMessage] = useState("");
  const [yourCamera, setYourCamera] = useState(true);
  const [remoteCamera, setRemoteCamera] = useState(true);
  const [stream, setStream] = useState<unknown>(null);
  let codecList: RTCRtpCodecCapability[] | null = null;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (data.type === "error") {
          setMessage(data.message);
        }
        if (data.type === "remoteName") {
          setRemoteName(data.name);
        }
        if (data.type === "cameraClosed") {
          setRemoteCamera(false);
        }
        if (data.type === "startCamera") {
          setRemoteCamera(true);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, pc]);

  const startSendingVideoHandler = async () => {
    if (!socket) return;

    const pc = new RTCPeerConnection();
    setPc(pc);

    // Write Codec From this point.

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
      audio: true,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      setYourCamera(true);
    }

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    setStream(stream);
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

    // Codec handling

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") {
        const senders = pc.getSenders();

        senders.forEach((sender) => {
          if (sender.track?.kind === "video") {
            codecList = sender.getParameters().codecs;
            if (pc && codecList) {
              changeVideoCodec(pc);
            }
          }
        });
      }
    };
  };

  const changeVideoCodec = async (peerConnection: RTCPeerConnection) => {
    const transceivers = peerConnection.getTransceivers();

    transceivers.forEach(async (transceiver) => {
      const kind = transceiver.sender.track?.kind;

      if (kind === "video" && codecList) {
        const h264 =
          RTCRtpSender.getCapabilities("video")?.codecs.filter((codec) => {
            if (codec.mimeType.includes("H264")) {
              return true;
            }
          }) ?? [];

        transceiver.setCodecPreferences(h264);
      }
    });
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket?.send(
      JSON.stringify({
        type: "createOffer",
        sdp: peerConnection.localDescription,
      })
    );

    peerConnection.onnegotiationneeded = async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket?.send(
        JSON.stringify({
          type: "createOffer",
          sdp: peerConnection.localDescription,
        })
      );
    };
  };

  const StopCameraHandler = () => {
    if (stream && pc) {
      setYourCamera(false);
      socket?.send(JSON.stringify({ type: "cameraClosed" }));
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
    if (pc) {
      setYourCamera(true);
      socket?.send(JSON.stringify({ type: "startCamera" }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setStream(stream);
    }
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
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700 space-y-4 p-4">
      {!remoteName && (
        <label className="text-2xl text-white text-center font-bold">
          Waiting for Users to Join . . .
        </label>
      )}
      {remoteName && !remoteUserJoined && (
        <label className="text-2xl text-white text-center font-bold">
          {remoteName} has Joined
        </label>
      )}
      {remoteName && !remoteUserJoined && (
        <button
          onClick={startSendingVideoHandler}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        >
          Accept ?
        </button>
      )}

      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 align-middle items-center">
        {yourCamera && (
          <div className="flex flex-col items-center">
            <video
              ref={localVideoRef}
              style={{ transform: "scaleX(-1)", width: "40rem" }}
              className=""
              autoPlay
            ></video>
            {remoteUserJoined && (
              <label className="text-white text-xl font-bold">You</label>
            )}
          </div>
        )}
        {!yourCamera && (
          <div className="flex flex-col bg-black rounded-3xl p-16 text-center gap-2 h-1/2">
            <img
              src={offCamera}
              className="rounded-full m-2"
              alt="Camera is Off"
            />
            {remoteUserJoined && (
              <label className="text-white text-xl font-bold">You</label>
            )}
          </div>
        )}
        {remoteCamera && remoteUserJoined && (
          <div className="flex flex-col items-center">
            <video
              ref={remoteVideoRef}
              style={{ transform: "scaleX(-1)", width: "40rem" }}
              className=""
              autoPlay
            ></video>
            <label className="text-white text-xl font-bold">
              {remoteName ? remoteName : ""}
            </label>
          </div>
        )}
        {!remoteCamera && (
          <div className="flex flex-col bg-black rounded-3xl p-16 text-center gap-2">
            <img
              src={offCamera}
              alt="Camera is Off"
              className="rounded-full m-2"
            />
            {remoteUserJoined && (
              <label className="text-white text-xl font-bold">
                {remoteName}
              </label>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col md:flex-row md:gap-8 items-center">
        <div className="flex flex-row gap-8">
          {yourCamera && remoteUserJoined && (
            <div onClick={StopCameraHandler} className="cursor-pointer">
              <img
                src={startCamera}
                className="cursor-pointer rounded-full w-12"
                alt="Stop Camera"
              />
            </div>
          )}
          {!yourCamera && (
            <div onClick={StartCameraHandler}>
              <img
                src={stopCamera}
                className="cursor-pointer rounded-full w-12"
                alt="Start Camera"
              />
            </div>
          )}
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
      {message && <label className="text-red-700 text-xl">{message}</label>}

      <MeetIdComponent meetId={meetId} />
    </div>
  );
};

export default Sender;
