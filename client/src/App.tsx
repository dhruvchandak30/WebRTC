import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Sender from './components/Sender';
import Reciever from './components/Reciever';
import Home from './components/Home';
import Landing from './components/Landing';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Home />} />
                <Route path="/sender" element={<Sender />} />
                <Route path="/reciever" element={<Reciever />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
