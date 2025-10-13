import "./App.css";
import Login from "./pages/Login";
import { Provider } from "react-redux";
import { Route, Routes, useNavigate } from "react-router-dom";
import { configureStore } from "./redux/Store";
import Chat2 from "./pages/Chat2";
import Profile from "./component/Profile";
import UserProfile from "./component/Profile";
import Groups from "./component/Group";
import { initializePrimaryColor } from "./utils/themeUtils";
import { useEffect } from "react";
import QRLoginPage from "./pages/QRLoginPage";
import ScannerPage from "./pages/ScannerPage";
import { SocketProvider } from "./context/SocketContext";
import LoginNew from "./pages/LoginNew";
import DeviceListPage from "./pages/DeviceListPage";

function App() {
  const { store, persistor } = configureStore();

  useEffect(() => {
    initializePrimaryColor();
  }, []);

  return (
    <Provider store={store}>
       <SocketProvider>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/" element={<LoginNew />}></Route>
        <Route path="/chat" element={<Chat2 />}></Route>
        <Route path="/profile" element={<Profile />}></Route>
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
