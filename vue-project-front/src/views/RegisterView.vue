<template>
    <div class="auth-page">
        <div class="auth-card">
            <h1>Регистрация</h1>
            <form @submit.prevent="register">
                <div class="form-group">
                    <label>Логин</label>
                    <input v-model="username" type="text" required>
                </div>
                <div class="form-group">
                    <label>Пароль</label>
                    <input v-model="password" type="password" required>
                </div>
                <div class="form-group">
                    <label>Роль</label>
                    <select v-model="role">
                        <option value="student">Студент</option>
                        <option value="teacher">Преподаватель</option>
                    </select>
                </div>
                <button type="submit">Зарегистрироваться</button>
                <p class="auth-switch">
                    Уже есть аккаунт? <router-link to="/login">Войти</router-link>
                </p>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { useUserStore } from '@/stores/user'

    const router = useRouter()
    const userStore = useUserStore()

    const username = ref('')
    const password = ref('')
    const role = ref('student')

    const register = async () => {
        try {
            await userStore.register(username.value, password.value, role.value)
            await router.push(role.value === 'teacher' ? '/teacher' : '/student')
        } catch (error) {
            alert('Ошибка регистрации: ' + error)
        }
    }
</script>

<style scoped>
    /* Стили аналогичные LoginView.vue */
    select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        background-color: white;
    }
    .auth-page {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: #f5f7fa;
    }

    .auth-card {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        width: 100%;
        max-width: 400px;
    }

    h1 {
        text-align: center;
        margin-bottom: 1.5rem;
        color: #333;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #555;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background: #4a6cf7;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        margin-top: 1rem;
    }

    button:hover {
        background: #3a5ce4;
    }

    .auth-switch {
        text-align: center;
        margin-top: 1rem;
        color: #666;
    }

    a {
        color: #4a6cf7;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style>