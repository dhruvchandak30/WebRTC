import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Sender from "./components/Sender";
import Reciever from "./components/Reciever";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sender" element={<Sender />} />
        <Route path="/reciever" element={<Reciever />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
