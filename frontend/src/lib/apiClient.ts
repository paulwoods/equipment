import axios from 'axios';

export const apiClient = axios.create({
    baseURL: '',
    timeout: 10_000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error),
);
