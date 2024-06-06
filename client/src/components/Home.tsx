import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "meet" | "name">(
    "home"
  );
  const [meetId, setMeetId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Access the user's camera
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    getUserMedia();

    // Cleanup function to stop the video stream when the component unmounts
    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const generateMeetId = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleCreateMeet = () => {
    const newMeetId = generateMeetId();
    setMeetId(newMeetId);
    setCurrentView("name");
  };

  const handleJoinMeet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (meetId.trim() && name.trim()) {
      const Id = meetId.trim();
      const userName = name.trim();
      navigate("/reciever", { state: { Id, userName } });
    }
  };

  const senderHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (meetId.trim() && name.trim()) {
      const Id = meetId.trim();
      const userName = name.trim();
      navigate("/sender", { state: { Id, userName } });
    }
  };

  if (currentView === "home") {
    return (
      <div className="flex flex-row  justify-around items-center min-h-screen bg-gray-700 space-y-6">
        <div className="flex flex-col gap-8">
          <button
            onClick={handleCreateMeet}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            Create Meet
          </button>
          <form
            onSubmit={handleJoinMeet}
            className="bg-white p-6 flex flex-col rounded-lg shadow-md space-y-4"
          >
            <label className="block mb-2 text-lg font-semibold text-gray-700">
              Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <label className="block mb-2 text-lg font-semibold text-gray-700">
              Enter Meet ID:
            </label>
            <input
              type="text"
              value={meetId}
              onChange={(e) => setMeetId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
              Join Meet
            </button>
          </form>
        </div>
        <div className="flex flex-col gap-6 items-center">
          <video
            ref={localVideoRef}
            style={{ transform: "scaleX(-1)" }}
            className="w-160 h-160 bg-black"
            autoPlay
          ></video>
          <label className="text-white text-xl mb-2">Camera Preview</label>
        </div>
      </div>
    );
  }

  if (currentView === "name") {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold text-gray-700">
            Meet ID: {meetId}
          </h1>
        </div>
        <form
          onSubmit={senderHandler}
          className="bg-white p-6 rounded-lg shadow-md space-y-4"
        >
          <label className="block mb-2 text-lg font-semibold text-gray-700">
            Name:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            Enter Meet
          </button>
        </form>
      </div>
    );
  }

  return null;
};

export default Home;
