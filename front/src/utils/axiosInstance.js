import axios from "axios";
import { BASE_URL } from "./baseUrl";
// import Cookies from "js-cookie";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, 
});

axiosInstance.interceptors.request.use(
  (config) => {

    const token =  localStorage.getItem("token");
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
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log(originalRequest,error.response);
    

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post( `${BASE_URL}/generateNewTokens`,{},
          {withCredentials: true,}
        );

        console.log(response);
        

        if (response.data.success && response.data.accessToken) {
          // Store the new token
          localStorage.setItem("token", response.data.accessToken);

          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        const { store } = require('../Redux/Store/Store').configStore();
        store.dispatch(logoutUser(_id));
        // If refresh token fails, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // store.dispatch(logoutUser(_id));
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;