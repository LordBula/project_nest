<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'

const router = useRouter()
const userStore = useUserStore()

const logout = () => {
    userStore.logout()
    router.push('/login')
}
</script>

<template>
    <div class="app">
        <header class="navbar" v-if="userStore.isAuthenticated">
            <div class="container">
                <router-link to="/" class="logo">Учебный портал</router-link>
                <div class="user-info">
                    <span>{{ userStore.user.username }} ({{ userStore.user.role === 'teacher' ? 'Преподаватель' : 'Студент' }})</span>
                    <button @click="logout" class="logout-btn">Выход</button>
                </div>
            </div>
        </header>
        <router-view />
    </div>
</template>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
}

.app {
    min-height: 100vh;
    background: #f5f7fa;
}

.navbar {
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1rem 0;
}

.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-weight: bold;
    color: #4a6cf7;
    text-decoration: none;
    font-size: 1.2rem;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logout-btn {
    background: none;
    border: 1px solid #e74c3c;
    color: #e74c3c;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}

.logout-btn:hover {
    background: #e74c3c;
    color: white;
}
</style>