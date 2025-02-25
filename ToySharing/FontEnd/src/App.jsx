import "./App.css";
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import SignUp from "./pages/user/signup/SignUp";
import ValidateMail from "./pages/user/signup/ValidateMail";
import InforInput from "./pages/user/signup/InforInput";
import ListBorrowRequests from "./pages/user/lender/ListBorrowRequests";
import SearchToy from "./pages/user/borrower/SearchingToy";
import Message from "./pages/user/generate/Message";
import UserInfor from "./pages/user/generate/UserInfor";
import AddToy from "./pages/user/lender/AddToy";
import MyToy from "./pages/user/lender/MyToy";

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

        <Route path="/listborrowrequests" element={<ListBorrowRequests />} />
        {/* Các route liên quan đến Lending */}
        <Route path="/lending" element={<ListBorrowRequests />} />
        <Route
          path="/lending/listborrowrequests"
          element={<ListBorrowRequests />}
        />

        <Route path="/searchtoy" element={<SearchToy />} />
        <Route path="/borrowing" element={<SearchToy />} />
        <Route path="/borrowing/searchtoy" element={<SearchToy />} />

        <Route path="/message" element={<Message />} />
        <Route path="/userinfor" element={<UserInfor />} />
        <Route path="/addtoy" element={<AddToy />} />
        <Route path="/mytoy" element={<MyToy />} />

        {/* Route mặc định nếu không khớp */}
        <Route path="*" element={<MyToy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
