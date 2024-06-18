import React, { useState, useRef } from "react";
import "react-tooltip/dist/react-tooltip.css";

interface Props {
  meetId: string;
}

const MeetIdComponent: React.FC<Props> = ({ meetId }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const meetIdRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState<string>("Copy to Clipboard");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetId).then(() => {
      setText("Copied To Cliboard");
    });
  };

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-md relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={copyToClipboard}
      ref={meetIdRef}
    >
      <h1 className="text-2xl font-semibold text-gray-700">
        Meet ID: {meetId}
      </h1>
      {showTooltip && (
        <div
          className="absolute top-0 left-0 mt-6 ml-6 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-md"
          style={{ transform: "translate(-50%, -100%)" }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default MeetIdComponent;
