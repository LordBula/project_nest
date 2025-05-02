import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null as null | { _id: string, username: string, role: string },
    }),
    actions: {
        setUser(user: any) {
            this.user = user;
        },
        logout() {
            this.user = null;
        }
    }
});
