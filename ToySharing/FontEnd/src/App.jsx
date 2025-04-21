import "./App.css";
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Logout from "./components/Logout";
import ForgotPassword from "./pages/user/forgotpassword/ForgotPassword";
import ChangePassword from "./pages/user/changepassword/ChangePassword";
import SignUp from "./pages/user/signup/SignUp";
import ValidateMail from "./pages/user/signup/ValidateMail";
import InforInput from "./pages/user/signup/InforInput";
import ListBorrowRequests from "./pages/user/lender/ListBorrowRequests";
import BorrowHistory from "./pages/user/borrower/BorrowHistory";
import SearchToy from "./pages/user/borrower/SearchingToy";
import Message from "./pages/user/generate/Message";
import UserInfor from "./pages/user/generate/UserInfor";
import UserDetail from "./pages/user/generate/UserDetail";
import TransactionHistory from "./pages/user/generate/TransactionHistory";
import AddToy from "./pages/user/lender/AddToy";
import MyToy from "./pages/user/lender/MyToy";
import InLending from "./pages/user/lender/InLending";
import TransferHistory from "./pages/user/lender/TransferHistory";
import Policy from "./pages/user/generate/Policy";
import UserGuide from "./pages/user/generate/UserGuide";
import SendingRequest from "./pages/user/borrower/SendingRequest";
import ToyDetail from "./pages/user/generate/ToyDetail";
import PaymentSuccess from "./pages/user/borrower/PaymentSuccess";
import PaymentError from "./pages/user/borrower/PaymentError";
import Banned from "./components/Banned";

// Admin
import AdminPage from "./pages/admin/AdminPage";
import ManageUser from "./pages/admin/ManageUser";
import Statistic from "./pages/admin/Statistic";
import ManagePost from "./pages/admin/ManagePost";
import BannerManagement from "./pages/admin/BannerManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import AdminProfile from "./pages/admin/AdminProfile";

// Route wrapper
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes (Accessible to everyone) */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/validatemail" element={<ValidateMail />} />
        <Route path="/inforinput" element={<InforInput />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/userguide" element={<UserGuide />} />
        <Route path="/toydetail/:toyId" element={<ToyDetail />} />
        <Route path="/banned" element={<Banned />} />

        {/* User Routes (Accessible only to logged-in Users) */}
        <Route element={<ProtectedRoute allowedRole="User"/>}>
          <Route path="/transaction-history" element={<TransactionHistory />} />
          <Route path="/listborrowrequests" element={<ListBorrowRequests />} />
          <Route path="/lending" element={<ListBorrowRequests />} />
          <Route path="/lending/listborrowrequests" element={<ListBorrowRequests />} />
          <Route path="/inlending" element={<InLending />} />
          <Route path="/searchtoy" element={<SearchToy />} />
          <Route path="/borrowing" element={<SearchToy />} />
          <Route path="/sendingrequest" element={<SendingRequest />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-error" element={<PaymentError />} />
          <Route path="/borrowhistory" element={<BorrowHistory />} />
          <Route path="/message" element={<Message />} />
          <Route path="/user-info/:userId" element={<UserInfor />} />
          <Route path="/userdetail/:id" element={<UserDetail />} />
          <Route path="/addtoy" element={<AddToy />} />
          <Route path="/mytoy" element={<MyToy />} />
          <Route path="/transferhistory" element={<TransferHistory />} />
        </Route>

        {/* Admin Routes (Accessible only to Admins) */}
        <Route element={<ProtectedRoute allowedRole="Admin" />}>
          <Route path="/adminprofile" element={<AdminProfile />} />
          <Route path="/adminpage" element={<AdminPage />} />
          <Route path="/manageuser" element={<ManageUser />} />
          <Route path="/managepost" element={<ManagePost />} />
          <Route path="/statistic" element={<Statistic />} />
          <Route path="/banner-management" element={<BannerManagement />} />
          <Route path="/category-management" element={<CategoryManagement />} />
        </Route>

        {/* Default Route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;