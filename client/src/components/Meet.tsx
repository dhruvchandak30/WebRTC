import { useLocation } from "react-router-dom";

interface LocationState {
  state: {
    meetId: string;
  };
}

const Meet: React.FC = () => {
  const location = useLocation();
  const { state } = location as LocationState;
  const meetId = state?.meetId || "No meet ID provided";

  return (
    <div className="flex  flex-col justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-gray-700">
          Meet ID: {meetId}
        </h1>
      </div>
    </div>
  );
};

export default Meet;
