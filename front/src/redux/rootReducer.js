import { combineReducers } from "redux";
import userSlice from "./slice/user.slice";
import authSlice from "./slice/auth.slice"; 
import manageStateSlice from "./slice/manageState.slice"; 

export const rootReducer = combineReducers({
    user:userSlice,
    auth:authSlice,
    magageState:manageStateSlice
});
