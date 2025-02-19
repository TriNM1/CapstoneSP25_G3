import "./App.css";
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import SignUp from "./pages/user/signup/SignUp";
import ValidateMail from "./pages/user/signup/ValidateMail";
import InforInput from "./pages/user/signup/InforInput";

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/validatemail" element={<ValidateMail />} />
        <Route path="/inforinput" element={<InforInput />} />

        {/* Route mặc định nếu không khớp */}
        <Route path="*" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
