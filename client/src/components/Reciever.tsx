import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

const Receiver = () => {
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [meetId, setMeetId] = useState<string>("");
  const [remoteName, setRemoteName] = useState<string>("");
  const [remoteUserJoined, setRemoteUserJoined] = useState<boolean>(false);
  const location = useLocation();
  const { state } = location as LocationState;
  const [message, setMessage] = useState("");
  const [remoteCamera, setRemoteCamera] = useState(true);
  const [stream, setStream] = useState<unknown>(null);
  const [yourCamera, setYourCamera] = useState(true);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [codecList, setCodecList] = useState<RTCRtpCodecCapability[] | null>(
    null
  );

  useEffect(() => {
    if (state) {
      setMeetId(state.Id);
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
        setRemoteName(message.name);
        setRemoteUserJoined(true);
        if (pc) {
          pc.close();
        }
        pc = new RTCPeerConnection();
        pcRef.current = pc;
        setPc(pc);

        // Codec handling

        pc.onicegatheringstatechange = () => {
          if (pc?.iceGatheringState === "complete") {
            const senders = pc.getSenders();

            senders.forEach((sender) => {
              if (sender.track?.kind === "video") {
                setCodecList(sender.getParameters().codecs);

                return;
              }
            });
          }
        };

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
          audio: true,
        });
        setStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          setYourCamera(true);
        }

        stream.getTracks().forEach((track) => pc?.addTrack(track, stream));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(
          JSON.stringify({ type: "createAnswer", sdp: pc.localDescription })
        );

        if (codecList) {
          changeVideoCodec("video/H264");
        }
      } else if (message.type === "iceCandidate" && pc) {
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
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
      } else if (message.type === "startCamera") {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetId, state.userName]);

  const changeVideoCodec = (mimeType: string) => {
    const transceivers = pc?.getTransceivers();
    transceivers?.forEach((transceiver) => {
      const kind = transceiver.sender.track?.kind;
      if (kind === "video") {
        const sendCodecs = RTCRtpSender.getCapabilities(kind)?.codecs;
        const recvCodecs = RTCRtpReceiver.getCapabilities(kind)?.codecs;

        if (sendCodecs && recvCodecs) {
          transceiver.setCodecPreferences(
            preferCodec([...sendCodecs, ...recvCodecs], mimeType)
          );

        } 
      }
    });
  };

  const preferCodec = (
    codecs: RTCRtpCodecCapability[],
    mimeType: string
  ): RTCRtpCodecCapability[] => {
    const sortedCodecs = codecs.filter((codec) => codec.mimeType === mimeType);
    const otherCodecs = codecs.filter((codec) => codec.mimeType !== mimeType);
    return [...sortedCodecs, ...otherCodecs];
  };

  const StopCameraHandler = () => {
    if (stream && pc) {
      setYourCamera(false);

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
    if (pc) {
      setYourCamera(true);
      socketRef.current?.send(JSON.stringify({ type: "startCamera" }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      setStream(stream);

      pc.onnegotiationneeded = async () => {
        const offer = await pc?.createOffer();
        await pc?.setLocalDescription(offer);
        socketRef.current?.send(
          JSON.stringify({ type: "offer", sdp: pc?.localDescription })
        );
      };

      if (codecList) {
        changeVideoCodec("video/H264"); // Change to your preferred codec MIME type
      }
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
      <div className="flex flex-col items-center text-center">
        {!remoteUserJoined && !message && (
          <label className="text-white text-xl font-bold text-center">
            Waiting for owner to let you In
          </label>
        )}
      </div>
      <div className="flex space-x-4 justify-center align-middle text-center items-center">
        {yourCamera && (
          <div className="flex flex-col items-center">
            <video
              style={{
                transform: "scaleX(-1)",
                width: "40rem",
                height: "30rem",
              }}
              ref={localVideoRef}
              autoPlay
            ></video>
            {remoteUserJoined && (
              <label className="text-white mb-2  text-xl font-bold">You</label>
            )}
          </div>
        )}
        {!yourCamera && (
          <div className="flex flex-col bg-black rounded-3xl p-16 h-1/2 text-center gap-2">
            <img
              src={offCamera}
              alt="Camera is Off"
              className="rounded-full m-2"
            />
            {remoteUserJoined && (
              <label className="text-white text-xl font-bold">You</label>
            )}
          </div>
        )}
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

            <label className="text-white mb-2  text-xl font-bold">
              {remoteName ? remoteName : ""}
            </label>
          </div>
        )}
        {!remoteCamera && (
          <div className="flex flex-col bg-black rounded-3xl p-16 text-center gap-2 h-1/2">
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
        <div className="flex items-center align-middle justify-center">
          {yourCamera && (
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

      {message && (
        <div className="flex flex-col text-center">
          <label className="text-red-700 font-bold text-3xl">{message}</label>
          <Link to="/" className="text-white text-3xl">
            Go Back
          </Link>
        </div>
      )}
      <MeetIdComponent meetId={meetId} />
    </div>
  );
};

export default Receiver;
