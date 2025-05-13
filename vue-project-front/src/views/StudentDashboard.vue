<template>
    <div class="dashboard">
        <header class="dashboard-header">
            <div class="header-content">
                <div class="header-info">
                    <h1>Панель студента</h1>
                </div>
                <button @click="logout" class="logout-btn">
                    <span class="logout-text">Выход</span>
                </button>
            </div>
        </header>

        <section class="quizzes-section">
            <h2 class="section-title">Доступные тесты</h2>
            <div class="quiz-cards">
                <div class="quiz-card" v-for="quiz in availableQuizzes" :key="quiz.id">
                    <div class="card-content">
                        <h3>{{ quiz.name }}</h3>
                        <p class="quiz-description">{{ quiz.description }}</p>
                        <router-link :to="quiz.path" class="start-btn">Начать тест</router-link>
                    </div>
                </div>
            </div>
        </section>

        <section class="results-section" v-if="previousResults.length">
            <h2 class="section-title">Предыдущие результаты</h2>
            <div class="table-container">
                <table class="results-table">
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
                        <td>
                            <span class="difficulty-badge" :class="getDifficultyClass(result.difficulty)">
                                {{ result.difficulty }}
                            </span>
                        </td>
                        <td>
                            <div class="score-container">
                                <div class="score-bar" :style="{ width: result.score + '%' }"></div>
                                <span>{{ result.score }}%</span>
                            </div>
                        </td>
                        <td>{{ result.timeSpent }} сек</td>
                        <td>{{ formatDate(result.createdAt) }}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <div v-else class="no-results">
            <p>У вас пока нет результатов тестов</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
const userStore = useUserStore()
const router = useRouter()

// Метод для выхода
const logout = async () => {
    try {
        await userStore.logout()
        router.push('/login') // Или ваш путь к странице входа
    } catch (error) {
        console.error('Ошибка при выходе:', error)
        alert('Не удалось выйти из системы')
    }
}

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
.dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
}

.dashboard-header {
    margin-bottom: 2.5rem;
    text-align: center;
}

.dashboard-header h1 {
    font-size: 2.5rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.welcome-text {
    font-size: 1.1rem;
    color: #7f8c8d;
}

.section-title {
    font-size: 1.8rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #f0f0f0;
}

.quiz-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.quiz-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    overflow: hidden;
}

.quiz-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
    padding: 1.5rem;
}

.quiz-card h3 {
    font-size: 1.3rem;
    color: #3498db;
    margin-bottom: 0.75rem;
}

.quiz-description {
    color: #7f8c8d;
    line-height: 1.5;
    margin-bottom: 1.5rem;
}

.start-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #3498db;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    transition: background-color 0.3s;
    border: none;
    cursor: pointer;
    text-align: center;
}

.start-btn:hover {
    background-color: #2980b9;
}

.results-section {
    margin-top: 3rem;
}

.table-container {
    overflow-x: auto;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.results-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
}

.results-table th {
    background-color: #f8f9fa;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
}

.results-table td {
    padding: 1rem;
    border-top: 1px solid #f0f0f0;
    vertical-align: middle;
}

.results-table tr:hover {
    background-color: #f8f9fa;
}

.difficulty-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

.difficulty-badge.easy {
    background-color: #d4edda;
    color: #155724;
}

.difficulty-badge.medium {
    background-color: #fff3cd;
    color: #856404;
}

.difficulty-badge.hard {
    background-color: #f8d7da;
    color: #721c24;
}

.difficulty-badge.default {
    background-color: #e2e3e5;
    color: #383d41;
}

.score-container {
    position: relative;
    display: inline-block;
    width: 100px;
    height: 24px;
    background: #f0f0f0;
    border-radius: 12px;
    overflow: hidden;
}

.score-bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    border-radius: 12px 0 0 12px;
}

.score-container span {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    text-align: center;
    line-height: 24px;
    font-size: 0.85rem;
    color: white;
    mix-blend-mode: difference;
}

.no-results {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
    font-size: 1.1rem;
}

dashboard-header {
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #f0f0f0;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.header-info {
    flex: 1;
}

.welcome-text {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #7f8c8d;
    margin-top: 5px;
}

.welcome-text i {
    font-size: 1.1em;
    color: #3498db;
}

.logout-btn {
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 8px 15px;
    color: #e74c3c;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    font-weight: 500;
}

.logout-btn:hover {
    background: rgba(231, 76, 60, 0.1);
    transform: translateY(-1px);
}

.logout-btn i {
    transition: transform 0.2s ease;
}

.logout-btn:hover i {
    transform: translateX(2px);
}

.logout-text {
    display: inline-block;
}

@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        align-items: flex-start;
    }

    .logout-btn {
        align-self: flex-end;
        padding: 6px 12px;
    }

    .logout-text {
        display: none;
    }

    .logout-btn i {
        font-size: 1.2em;
    }
}

@media (max-width: 768px) {
    .dashboard {
        padding: 1rem;
    }

    .quiz-cards {
        grid-template-columns: 1fr;
    }
}
</style>
