import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost/api/v1",
    // baseURL: "https://hourlystay.com/api/v1",
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access")
    if (token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api;