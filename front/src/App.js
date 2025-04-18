import "./App.css";
import Chat11 from "./pages/Chat11";
import Login from "./pages/Login";
import { Provider } from "react-redux";
import { Route, Routes, useNavigate } from "react-router-dom";
import { configureStore } from "./redux/Store";
import Chat2 from "./pages/Chat2";
import Front from "./component/Front";
import ChatNew from "./pages/ChatNew";
import Profile from "./component/Profile";
import UserProfile from "./component/Profile";
import Groups from "./component/Group";
import { initializePrimaryColor } from "./utils/themeUtils";
import { useEffect } from "react";
import LoginNew from "./pages/LoginNew";

function App() {
  const { store, persistor } = configureStore();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("userId");
  useEffect(() => {
    // Initialize primary color on app load
    initializePrimaryColor();
  }, []);


  useEffect(() => {
    if(!token  && !user){
      navigate('/');
    }
  },[])

  return (
    <Provider store={store}>
      <Routes>
        {/* <Route path="/login" element={<Login />}></Route> */}
        <Route path="/" element={<Login />}></Route>
        <Route path="/login" element={<LoginNew />}></Route>
        <Route path="/chat" element={<Chat2 />}></Route>
        <Route path="/profile" element={<Profile />}></Route>
        <Route path="/chatNew" element={<ChatNew />}></Route>
        <Route path="/profile/:userId" element={<UserProfile />}></Route>
        <Route path="/groups" element={<Groups />}></Route>
        {/* <Route path="/chat2" element={<Chat11 />}></Route> */}
        {/* <Route path="/front" element={<Front />}></Route> */}
        {/* <Route path="/chatNew" element={<ChatNew/>}></Route> */}
      </Routes>
    </Provider>
  );
}
export default App;
