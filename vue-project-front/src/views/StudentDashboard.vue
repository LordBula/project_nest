<template>
    <div class="student-dashboard">
        <header class="dashboard-header">
            <div class="header-content">
                <div class="header-info">
                    <h1>Панель студента</h1>
                    <p class="welcome-text">
                        <i class="fas fa-user"></i> {{ userStore.user.username }}
                    </p>
                </div>
                <button @click="logout" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span class="logout-text">Выход</span>
                </button>
            </div>
        </header>

        <section class="quizzes-section">
            <h2 class="section-title">Доступные тесты</h2>

            <div v-if="loadingTasks" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Загрузка тестов...
            </div>

            <div v-else-if="availableTasks.length === 0" class="no-tests">
                <i class="fas fa-info-circle"></i> Нет доступных тестов
            </div>

            <div v-else class="quiz-cards">
                <div v-for="task in availableTasks" :key="task._id" class="quiz-card">
                    <div class="card-content">
                        <h3>{{ task.name }}</h3>
                        <p class="quiz-description">{{ task.description }}</p>
                        <div class="quiz-meta">
              <span class="questions-count">
                <i class="fas fa-question-circle"></i>
                {{ task.questions.length }} вопросов
              </span>
                            <router-link
                                :to="`/task/${task._id}`"
                                class="start-btn"
                            >
                                <i class="fas fa-play"></i> Начать тест
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="results-section" v-if="previousResults.length > 0">
            <h2 class="section-title">Мои результаты</h2>

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
                  {{ formatDifficulty(result.difficulty) }}
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
            <i class="fas fa-info-circle"></i> У вас пока нет результатов тестов
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const router = useRouter();

const availableTasks = ref([]);
const previousResults = ref([]);
const loadingTasks = ref(false);
const loadingResults = ref(false);

const loadTasks = async () => {
    try {
        loadingTasks.value = true;
        const response = await api.get('/tasks/active'); // И здесь
        availableTasks.value = response.data;
    } catch (error) {
        alert('Ошибка загрузки тестов: ' + error.message);
    } finally {
        loadingTasks.value = false;
    }
};

const loadResults = async () => {
    try {
        loadingResults.value = true;
        const response = await api.get('/results', {
            params: { userId: userStore.user._id }
        });
        previousResults.value = response.data;
    } catch (error) {
        console.error('Ошибка загрузки результатов:', error);
    } finally {
        loadingResults.value = false;
    }
};

const formatDifficulty = (difficulty) => {
    const levels = {
        easy: 'Легкий',
        medium: 'Средний',
        hard: 'Сложный'
    };
    return levels[difficulty] || difficulty;
};

const getDifficultyClass = (difficulty) => {
    return difficulty || 'default';
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
};

const logout = async () => {
    try {
        await userStore.logout();
        router.push('/login');
    } catch (error) {
        alert('Ошибка при выходе: ' + error.message);
    }
};

onMounted(() => {
    loadTasks();
    loadResults();
});
</script>

<style scoped>
.student-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
}

.dashboard-header {
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

.header-info h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.2rem;
    color: #2c3e50;
}

.welcome-text {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: #7f8c8d;
    font-size: 1.1rem;
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

.section-title {
    font-size: 1.8rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #f0f0f0;
}

.quiz-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

.quiz-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
}

.questions-count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    color: #666;
}

.start-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.75rem 1.5rem;
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    transition: background-color 0.3s;
    border: none;
    cursor: pointer;
}

.start-btn:hover {
    background-color: #3d8b40;
}

.results-section {
    margin-top: 3rem;
}

.table-container {
    overflow-x: auto;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    margin-top: 1.5rem;
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

.loading {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
    font-size: 1.1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.loading i {
    font-size: 1.5rem;
}

.no-tests,
.no-results {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
    font-size: 1.1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.no-tests i,
.no-results i {
    font-size: 1.5rem;
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

    .quiz-cards {
        grid-template-columns: 1fr;
    }

    .dashboard {
        padding: 1rem;
    }
}
</style>