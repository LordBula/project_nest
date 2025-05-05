<template>
    <div class="dashboard">
        <h1>Панель студента</h1>

        <div class="quiz-cards">
            <div class="quiz-card" v-for="quiz in availableQuizzes" :key="quiz.id">
                <h3>{{ quiz.name }}</h3>
                <p>{{ quiz.description }}</p>
                <router-link :to="quiz.path" class="start-btn">Начать тест</router-link>
            </div>
        </div>

        <div class="previous-results" v-if="previousResults.length">
            <h2>Предыдущие результаты</h2>
            <table>
                <thead>
                <tr>
                    <th>Тест</th>
                    <th>Сложность</th>
                    <th>Результат</th>
                    <th>Время</th>
                    <th>Дата</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="result in previousResults" :key="result._id">
                    <td>{{ result.testName }}</td>
                    <td>{{ result.difficulty }}</td>
                    <td>{{ result.score }}%</td>
                    <td>{{ result.timeSpent }} сек</td>
                    <td>{{ new Date(result.createdAt).toLocaleDateString() }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'

const availableQuizzes = ref([
    {
        id: 1,
        name: 'HTML Quiz',
        description: 'Тест по основам HTML',
        path: '/html-quiz'
    }
])

const previousResults = ref([])

onMounted(async () => {
    try {
        const response = await api.get('/api/results')
        previousResults.value = response.data
    } catch (error) {
        console.error('Ошибка загрузки результатов:', error)
    }
})
</script>


<style scoped>
.quiz-cards {
    display: flex;
    gap: 20px;
    margin: 30px 0;
}

.quiz-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    width: 300px;
}

.start-btn {
    display: inline-block;
    margin-top: 15px;
    padding: 8px 16px;
    background-color: #42b983;
    color: white;
    text-decoration: none;
    border-radius: 4px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

th {
    background-color: #f2f2f2;
}
</style>
