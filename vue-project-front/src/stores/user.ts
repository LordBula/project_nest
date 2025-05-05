import { defineStore } from 'pinia'
import api from '@/services/api'

interface IUser {
    username: string,
    password: string,
    role: string,
}

export const useUserStore = defineStore('user', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user') || '{}') || {} as IUser,
        isAuth: JSON.parse(localStorage.getItem('isAuth') || 'false') || false
    }),
    actions: {
        async login(username: string, password: string) {
            const response = await api.post<IUser>('/auth/login', { username, password })
            this.user = response.data
            this.isAuth = true

            localStorage.setItem('user', JSON.stringify(response.data))
            localStorage.setItem('isAuth', JSON.stringify(true))
        },
        async register(username: string, password: string, role: string) {
            const response = await api.post<IUser>('/auth/register', { username, password, role })
            this.user = response.data
            this.isAuth = true

            localStorage.setItem('user', JSON.stringify(response.data))
            localStorage.setItem('isAuth', JSON.stringify(true))
        },
        async logout() {
            this.user = {}
            this.isAuth = false

            localStorage.removeItem('user')
            localStorage.removeItem('isAuth')
        }
    }
})