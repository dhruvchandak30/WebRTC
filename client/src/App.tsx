import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
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
      <div>
        <Link to="/sender">Sender</Link>
        <Link to="/reciever">Reciever</Link>
      </div>
    </BrowserRouter>
  );
}

export default App;
