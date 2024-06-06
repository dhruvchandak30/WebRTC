import { BrowserRouter,  Route, Routes } from "react-router-dom";
import "./App.css";
import Sender from "./components/Sender";
import Reciever from "./components/Reciever";
import Home from "./components/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sender" element={<Sender />} />
        <Route path="/reciever" element={<Reciever />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
