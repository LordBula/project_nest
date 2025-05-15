<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const router = useRouter();

const availableTasks = ref([]);
const previousResults = ref([]);
const loadingTasks = ref(false);
const loadingResults = ref(false);
const errorTasks = ref(null);
const errorResults = ref(null);

const loadTasks = async () => {
  try {
    loadingTasks.value = true;
    errorTasks.value = null;

    const response = await api.get('/tasks/active');
    console.log('Ответ сервера (тесты):', response.data); // Для отладки

    // Обработка разных форматов ответа
    const tasksData = response.data?.data || response.data || [];

    availableTasks.value = tasksData.map(task => ({
      id: task._id || task.id,
      name: task.name || 'Без названия',
      description: task.description || '',
      difficulty: task.difficulty,
      createdAt: task.createdAt || new Date().toISOString(),
      quizPath: `/html-quiz/${task._id || task.id}`
    }));

  } catch (error) {
    errorTasks.value = `Ошибка загрузки тестов: ${error.response?.data?.message || error.message}`;
    console.error('Ошибка:', error);
  } finally {
    loadingTasks.value = false;
  }
};


const loadResults = async () => {
  try {
    loadingResults.value = true;
    errorResults.value = null;

    if (!userStore.user?._id) {
      throw new Error('Пользователь не авторизован');
    }

    const response = await api.get('/results', {
      params: { userId: userStore.user._id }
    });

    // Обрабатываем возможные форматы ответа
    previousResults.value = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
            ? response.data
            : [];

  } catch (error) {
    errorResults.value = 'Ошибка загрузки результатов: ' + (error.response?.data?.message || error.message);
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
  return `difficulty-${difficulty}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Дата не указана';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime())
        ? 'Некорректная дата'
        : date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
  } catch {
    return dateString;
  }
};

const formatScore = (score) => {
  return typeof score === 'number' ? `${score}%` : score;
};

const getScoreClass = (score) => {
  if (typeof score !== 'number') return '';
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-average';
  return 'score-poor';
};

const logout = async () => {
  try {
    await userStore.logout();
    router.push('/login');
  } catch (error) {
    alert('Ошибка при выходе: ' + error.message);
  }
};

// Автоматически обновляем данные при изменении авторизации
userStore.$subscribe(() => {
  if (userStore.isAuth) {
    loadTasks();
    loadResults();
  }
});

onMounted(() => {
  if (userStore.isAuth) {
    loadTasks();
    loadResults();
  } else {
    router.push('/login');
  }
});
</script>

<template>
  <div class="student-dashboard">
    <header class="dashboard-header">
      <h1>Панель студента</h1>
      <button @click="logout" class="logout-btn">Выйти</button>
    </header>

    <div class="dashboard-content">
      <!-- Секция доступных тестов -->
      <section class="tasks-section">
        <h2>Доступные тесты</h2>

        <div v-if="loadingTasks" class="loading-indicator">
          <div class="spinner"></div>
          <span>Загрузка тестов...</span>
        </div>

        <div v-else-if="errorTasks" class="error-message">
          {{ errorTasks }}
          <button @click="loadTasks" class="retry-btn">Повторить попытку</button>
        </div>

        <div v-else-if="availableTasks.length === 0" class="empty-state">
          Нет доступных тестов
        </div>

        <div v-else class="tasks-grid">
          <router-link
              v-for="task in availableTasks"
              :key="task.id"
              :to="task.quizPath"
              class="task-card"
              tag="div"
          >
            <div class="task-header">
              <h3>{{ task.name }}</h3>
              <div class="task-meta">
  <span
      :class="getDifficultyClass(task.difficulty)"
      class="difficulty-badge"
  >
    {{ formatDifficulty(task.difficulty) }}
  </span>
              </div>
            </div>
            <p class="task-description">{{ task.description }}</p>
            <div class="task-footer">
              <span class="task-date">Добавлен: {{ formatDate(task.createdAt) }}</span>
              <button class="start-btn">Начать тест</button>
            </div>
          </router-link>
        </div>
      </section>

      <!-- Секция предыдущих результатов -->
      <section class="results-section">
        <h2>Ваши результаты</h2>

        <div v-if="loadingResults" class="loading-indicator">
          <div class="spinner"></div>
          <span>Загрузка результатов...</span>
        </div>

        <div v-else-if="errorResults" class="error-message">
          {{ errorResults }}
          <button @click="loadResults" class="retry-btn">Повторить попытку</button>
        </div>

        <div v-else-if="previousResults.length === 0" class="empty-state">
          Нет сохраненных результатов
        </div>

        <div v-else class="results-table">
          <table>
            <thead>
            <tr>
              <th>Тест</th>
              <th>Сложность</th>
              <th>Дата</th>
              <th>Результат</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="result in previousResults" :key="result._id">
              <td>{{ result.testName || 'Неизвестный тест' }}</td>
              <td>
                                    <span
                                        v-if="result.difficulty"
                                        :class="getDifficultyClass(result.difficulty)"
                                        class="difficulty-badge"
                                    >
    {{ formatDifficulty(result.difficulty) }}
  </span>
                <span v-else class="difficulty-badge difficulty-unknown">
    Не указана
  </span>
              </td>
              <td>{{ formatDate(result.createdAt || result.date) }}</td>
              <td :class="getScoreClass(result.score)">
                {{ formatScore(result.score) }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tasks-grid a {
  text-decoration: none;
  color: inherit;
}

.student-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #c0392b;
}

.dashboard-content {
  display: grid;
  gap: 40px;
}

.tasks-section, .results-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #7f8c8d;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #e74c3c;
  background: #fadbd8;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.retry-btn {
  margin-left: 10px;
  background: #3498db;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.empty-state {
  color: #7f8c8d;
  text-align: center;
  padding: 20px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.task-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.task-meta {
  display: flex;
  gap: 5px;
}

.difficulty-badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.difficulty-easy {
  background: #d5f5e3;
  color: #27ae60;
}

.difficulty-medium {
  background: #fef9e7;
  color: #f39c12;
}

.difficulty-hard {
  background: #fadbd8;
  color: #c0392b;
}

.task-description {
  color: #7f8c8d;
  margin-bottom: 15px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #95a5a6;
}

.start-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  pointer-events: none;
}

.results-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 500;
}

tr:hover {
  background: #f8f9fa;
}

.score-excellent {
  color: #27ae60;
  font-weight: bold;
}

.score-good {
  color: #f39c12;
  font-weight: bold;
}

.score-average {
  color: #e67e22;
}

.score-poor {
  color: #e74c3c;
}

@media (max-width: 768px) {
  .tasks-grid {
    grid-template-columns: 1fr;
  }

  th, td {
    padding: 8px 10px;
  }
}
</style>