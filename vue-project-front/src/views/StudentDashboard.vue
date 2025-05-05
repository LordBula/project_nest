<template>
    <div>
        <h2>Добро пожаловать, студент!</h2>
        <h3>Задания по PHP:</h3>
        <div class="dashboard">
            <h1>Панель студента</h1>
            <nav>
                <router-link to="/html-quiz" class="quiz-link">Пройти тест по HTML</router-link>
            </nav>
        </div>
        <ul>
            <li v-for="task in tasks" :key="task._id">
                {{ task.title }}
                <pre>{{ task.description }}</pre>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import {ref, onMounted} from 'vue';
    import api from '@/services/api';

    interface ITask {
        _id: string,
        title: string,
        description: string,
    }

    const tasks = ref<ITask[]>([]);

    onMounted(async () => {
        const res = await api.get<ITask[]>('/tasks');
        tasks.value = res.data
    })
</script>

<style scoped>
    .quiz-link {
        display: inline-block;
        margin: 20px 0;
        padding: 10px 20px;
        background-color: #42b983;
        color: white;
        text-decoration: none;
        border-radius: 4px;
    }

    .quiz-link:hover {
        background-color: #369f6b;
    }
</style>
