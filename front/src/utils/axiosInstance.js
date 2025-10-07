import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { logoutUser } from "../redux/slice/auth.slice";
import Cookies from 'js-cookie';
const userId = sessionStorage.getItem("userId") || localStorage.getItem("ChatuserId") ;
// import Cookies from "js-cookie";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, 
});

axiosInstance.interceptors.request.use(
  (config) => {

    const token =  sessionStorage.getItem("token") || localStorage.getItem("ChatToken") ;
    // console.log(token,"-==-=-=-=-=-=");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     console.log(originalRequest.url,"--=-=-=-=-=-=rererert");
    

//     // If error is 401 and we haven't tried to refresh token yet
//     if (error.response?.status === 401 &&  !originalRequest._retry &&  !originalRequest.url.includes('/generateNewTokens') ) {
//       originalRequest._retry = true;

//       try {
//         // Try to refresh the token
//         const refreshToken = Cookies.get('refreshToken') || localStorage.getItem('refreshToken');
//         const response = await axios.post(`${BASE_URL}/generateNewTokens`, {}, { headers: { 'Authorization': `Bearer ${refreshToken}` } }, { withCredentials: true });

//         console.log(response);
      
//         if (response.data.success && response.data.accessToken) {
//           // Store the new token
//           localStorage.setItem("token", response.data.accessToken);
//           sessionStorage.setItem("token", response.data.accessToken);
//           localStorage.setItem('refreshToken',response.data.refreshToken);
//           // Update the original request with new token
//           originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

//           // Retry the original request
//           return axiosInstance(originalRequest);
//         }
//       } catch (refreshError) {
//         const { store } = require('../redux/Store').configureStore();
//         store.dispatch(logoutUser(userId));
//         // If refresh token fails, redirect to login
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         // store.dispatch(logoutUser(_id));
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/generateNewTokens')
    ) {
      if (isRefreshing) {
        // If refresh is in progress, queue the request
        return new Promise(function (resolve, reject) {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              resolve(axiosInstance(originalRequest));
            },
            reject: (err) => {
              reject(err);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken') || localStorage.getItem('refreshToken');
      try {
        const response = await axios.post(
          `${BASE_URL}/generateNewTokens`,
          {},
          { headers: { 'Authorization': `Bearer ${refreshToken}` }, withCredentials: true }
        );

        if (response.data.success && response.data.accessToken) {
          localStorage.setItem("token", response.data.accessToken);
          sessionStorage.setItem("token", response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          if(window.electron){
            window.electron.saveAuthData({
              token: response.data.accessToken,
              userId: userId,
              refToken: response.data.refreshToken
            });
          }
          processQueue(null, response.data.accessToken);

          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        const { store } = require('../redux/Store').configureStore();
        store.dispatch(logoutUser(userId));
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;