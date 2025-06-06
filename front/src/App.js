import "./App.css";
import Chat11 from "./pages/Chat11";
import Login from "./pages/Login";
import { Provider } from "react-redux";
import { Route, Routes, useNavigate } from "react-router-dom";
import { configureStore } from "./redux/Store";
import Chat2 from "./pages/Chat2";
import Front from "./component/Front";
// import ChatNew from "./pages/ChatNew";
import Profile from "./component/Profile";
import UserProfile from "./component/Profile";
import Groups from "./component/Group";
import { initializePrimaryColor } from "./utils/themeUtils";
import { useEffect } from "react";
// import LoginNew from "./pages/LoginNew";
import QRLoginPage from "./pages/QRLoginPage";
import ScannerPage from "./pages/ScannerPage";
import { SocketProvider } from "./context/SocketContext";
import LoginNew from "./pages/LoginNew";
import DeviceListPage from "./pages/DeviceListPage";

function App() {
  const { store, persistor } = configureStore();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("userId");
  useEffect(() => {
    // Initialize primary color on app load
    initializePrimaryColor();
  }, []);

  return (
    <Provider store={store}>
       <SocketProvider>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        {/* <Route path="/login" element={<LoginNew />}></Route> */}
        <Route path="/" element={<LoginNew />}></Route>
        <Route path="/chat" element={<Chat2 />}></Route>
        <Route path="/profile" element={<Profile />}></Route>
        {/* <Route path="/chatNew" element={<ChatNew />}></Route> */}
        <Route path="/profile/:userId" element={<UserProfile />}></Route>
        <Route path="/groups" element={<Groups />}></Route>
        <Route path="/g" element={<QRLoginPage />}></Route>
        <Route path="/scanner" element={<ScannerPage />}></Route>
        <Route path="/devices" element={<DeviceListPage />}></Route>
      </Routes>
      </SocketProvider>
    </Provider>
  );
}
export default App;
