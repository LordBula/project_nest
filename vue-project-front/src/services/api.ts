import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:3000', // Адрес вашего NestJS-сервера
    headers: {
        'Content-Type': 'application/json'
    }
})

export default api