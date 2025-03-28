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
import UserDetail from "./pages/user/generate/UserDetail"; 
import AddToy from "./pages/user/lender/AddToy";
import MyToy from "./pages/user/lender/MyToy";
import InLending from "./pages/user/lender/InLending";
import TransferHistory from "./pages/user/lender/TransferHistory";
import Policy from "./pages/user/generate/Policy";
import UserGuide from "./pages/user/generate/UserGuide";
import SendingRequest from "./pages/user/borrower/SendingRequest";
import ToyDetail from "./pages/user/generate/ToyDetail";
//admin
import AdminPage from "./pages/admin/AdminPage";
import ManageUser from "./pages/admin/ManageUser";
import CheckingPost from "./pages/admin/CheckingPost";
import ManageFeedback from "./pages/admin/ManageFeedback";
import Statistic from "./pages/admin/Statistic";

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
        <Route path="/policy" element={<Policy />} />
        <Route path="/userguide" element={<UserGuide />} />

        <Route path="/listborrowrequests" element={<ListBorrowRequests />} />
        {/* Các route liên quan đến Lending */}
        <Route path="/lending" element={<ListBorrowRequests />} />
        <Route
          path="/lending/listborrowrequests"
          element={<ListBorrowRequests />}
        />
        <Route path="/lending/inlending" element={<InLending />} />

        <Route path="/searchtoy" element={<SearchToy />} />
        <Route path="/borrowing" element={<SearchToy />} />
        <Route path="/borrowing/searchtoy" element={<SearchToy />} />
        <Route path="/sendingrequest" element={<SendingRequest />} />

        <Route path="/message" element={<Message />} />
        <Route path="/user-info/:userId" element={<UserInfor />} />
        <Route path="/userdetail" element={<UserDetail/>} />
        <Route path="/addtoy" element={<AddToy />} />
        <Route path="/mytoy" element={<MyToy />} />
        <Route path="/inlending" element={<InLending />} />
        <Route path="/transferhistory" element={<TransferHistory />} />

        <Route path="/adminpage" element={<AdminPage />} />
        <Route path="/manageuser" element={<ManageUser />} />
        <Route path="/checkingpost" element={<CheckingPost />} />
        <Route path="/managefeedback" element={<ManageFeedback />} />
        <Route path="/statistic" element={<Statistic />} />

        {/* Route ToyDetail */}
        <Route path="/toydetail/:toyId" element={<ToyDetail />} />

        {/* Route mặc định nếu không khớp */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
