<template>
    <div class="teacher-dashboard">
        <header class="dashboard-header">
            <div class="header-content">
                <div class="header-info">
                    <h1>Панель преподавателя</h1>
                </div>
                <button @click="logout" class="logout-btn">
                    <span class="logout-text">Выход</span>
                </button>
            </div>
        </header>

        <div class="tabs">
            <button
                @click="switchTab('attendance')"
                :class="{ active: activeTab === 'attendance' }"
            >
                Посещаемость
            </button>
            <button
                @click="switchTab('results')"
                :class="{ active: activeTab === 'results' }"
            >
                Результаты
            </button>
            <button
                @click="switchTab('tasks')"
                :class="{ active: activeTab === 'tasks' }"
            >
                Тесты
            </button>
        </div>

        <!-- Вкладка посещаемости -->
        <div v-if="activeTab === 'attendance'" class="tab-content">
            <div class="attendance-form">
                <h2>Посещаемость студентов</h2>
                <div class="student-list">
                    <div v-for="student in students" :key="student._id" class="student-item">
                        <label class="student-label">
                            <input
                                type="checkbox"
                                v-model="student.present"
                                @change="updateAttendance(student)"
                            >
                            <span class="student-name">{{ student.username }}</span>
                        </label>
                        <span class="attendance-status" :class="{ present: student.present }">
              {{ student.present ? 'Присутствует' : 'Отсутствует' }}
            </span>
                    </div>
                </div>
                <button @click="saveAllAttendance" class="save-btn">
                    Сохранить посещаемость
                </button>
            </div>
        </div>

        <!-- Вкладка результатов -->
        <div v-if="activeTab === 'results'" class="tab-content">
            <div class="results-container">
                <h2>Результаты тестов</h2>
                <div class="filters">
                    <div class="filter-group">
                        <label>Студент:</label>
                        <select v-model="selectedStudent">
                            <option value="">Все студенты</option>
                            <option v-for="s in students" :key="s._id" :value="s._id">
                                {{ s.username }}
                            </option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Тест:</label>
                        <select v-model="selectedTask">
                            <option value="">Все тесты</option>
                            <option v-for="t in tasks" :key="t._id" :value="t._id">
                                {{ t.name }}
                            </option>
                        </select>
                    </div>
                    <button @click="refreshResults" class="refresh-btn">
                        Обновить
                    </button>
                </div>

                <div v-if="loadingResults" class="loading">Загрузка...</div>

                <div v-else class="results-table-container">
                    <table class="results-table">
                        <thead>
                        <tr>
                            <th @click="sortResults('student')">Студент</th>
                            <th @click="sortResults('test')">Тест</th>
                            <th @click="sortResults('score')">Результат</th>
                            <th @click="sortResults('date')">Дата</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="result in sortedResults" :key="result._id">
                            <td>{{ getStudentName(result.userId) }}</td>
                            <td>{{ getTaskName(result.taskId) }}</td>
                            <td :class="getResultClass(result.score)">
                                {{ result.score }}%
                            </td>
                            <td>{{ formatDate(result.createdAt) }}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Вкладка управления тестами -->
        <div v-if="activeTab === 'tasks'" class="tab-content">
            <div class="tasks-container">
                <div class="tasks-header">
                    <h2>Управление тестами</h2>
                    <button @click="openTaskForm(null)" class="create-btn">
                        + Создать тест
                    </button>
                </div>

                <CreateTaskForm
                    v-if="showTaskForm"
                    :taskId="editingTaskId"
                    @save="handleTaskSave"
                    @cancel="closeTaskForm"
                />

                <div v-if="loadingTasks" class="loading">Загрузка тестов...</div>

                <div v-else-if="tasks.length === 0" class="no-tasks">
                    Нет созданных тестов
                </div>

                <div v-else class="tasks-list">
                    <div v-for="task in tasks" :key="task._id" class="task-card">
                        <div class="task-info">
                            <h3>{{ task.name }}</h3>
                            <p class="task-description">{{ task.description }}</p>
                            <div class="task-meta">
                                <span>Вопросов: {{ task.questions.length }}</span>
                                <span class="task-status" :class="{ active: task.isActive }">
                  {{ task.isActive ? 'Активен' : 'Архив' }}
                </span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button @click="openTaskForm(task._id)" class="edit-btn">
                                Редактировать
                            </button>
                            <button
                                @click="toggleTaskStatus(task._id, !task.isActive)"
                                class="status-btn"
                                :class="{ archive: task.isActive }"
                            >
                                {{ task.isActive ? 'В архив' : 'Активировать' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch} from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import CreateTaskForm from '@/views/CreateTaskForm.vue';

const router = useRouter();

import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

// Состояние приложения
const activeTab = ref('attendance');
const students = ref([]);
const tasks = ref([]);
const results = ref([]);
const selectedStudent = ref('');
const selectedTask = ref('');
const showTaskForm = ref(false);
const editingTaskId = ref(null);
const loadingStudents = ref(false);
const loadingTasks = ref(false);
const loadingResults = ref(false);
const sortField = ref('date');
const sortDirection = ref('desc');


// Загрузка данных
const loadInitialData = async () => {
    await Promise.all([
        loadStudents(),
        loadTasks(),
        loadResults()
    ]);
};

const loadStudents = async () => {
    try {
        loadingStudents.value = true;
        const response = await api.get('/users', { params: { role: 'student' } });
        students.value = response.data.map(s => ({ ...s, present: false }));
    } catch (error) {
        alert('Ошибка загрузки студентов: ' + error.message);
    } finally {
        loadingStudents.value = false;
    }
};

const loadTasks = async () => {
    try {
        loadingTasks.value = true;
        const response = await api.get('/tasks'); // Измените URL здесь
        tasks.value = response.data;
    } catch (error) {
        alert('Ошибка загрузки тестов: ' + error.message);
    } finally {
        loadingTasks.value = false;
    }
};

const loadResults = async () => {
    try {
        loadingResults.value = true;
        const params = {};
        if (selectedStudent.value) params.studentId = selectedStudent.value;
        if (selectedTask.value) params.taskId = selectedTask.value;

        const response = await api.get('/results', { params });
        results.value = response.data;
    } catch (error) {
        alert('Ошибка загрузки результатов: ' + error.message);
    } finally {
        loadingResults.value = false;
    }
};

// Методы для посещаемости
const updateAttendance = async (student) => {
    try {
        await api.post('/attendance', {
            studentId: student._id,
            status: student.present ? 'present' : 'absent',
            date: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        student.present = !student.present;
        alert('Ошибка сохранения: ' + error.message);
    }
};

const saveAllAttendance = async () => {
    try {
        await Promise.all(students.value.map(student =>
            api.post('/attendance', {
                studentId: student._id,
                status: student.present ? 'present' : 'absent',
                date: new Date().toISOString().split('T')[0]
            })
        ));
        alert('Посещаемость сохранена!');
    } catch (error) {
        alert('Ошибка сохранения: ' + error.message);
    }
};

// Методы для тестов
const openTaskForm = (taskId) => {
    editingTaskId.value = taskId;
    showTaskForm.value = true;
};

const closeTaskForm = () => {
    showTaskForm.value = false;
    editingTaskId.value = null;
};

const handleTaskSave = () => {
    closeTaskForm();
    loadTasks();
};

const toggleTaskStatus = async (taskId, newStatus) => {
    const action = newStatus ? 'активировать' : 'архивировать';
    if (!confirm(`Вы уверены, что хотите ${action} этот тест?`)) return;

    try {
        if (newStatus) {
            await api.patch(`/tasks/${taskId}`, { isActive: true });
        } else {
            await api.delete(`/tasks/${taskId}`);
        }
        loadTasks();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

// Методы для результатов
const refreshResults = () => {
    loadResults();
};

const sortResults = (field) => {
    if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortField.value = field;
        sortDirection.value = 'asc';
    }
};

const sortedResults = computed(() => {
    return [...results.value].sort((a, b) => {
        let valA, valB;

        switch (sortField.value) {
            case 'student':
                valA = getStudentName(a.userId);
                valB = getStudentName(b.userId);
                break;
            case 'test':
                valA = getTaskName(a.taskId);
                valB = getTaskName(b.taskId);
                break;
            case 'score':
                valA = a.score;
                valB = b.score;
                break;
            case 'date':
            default:
                valA = new Date(a.createdAt);
                valB = new Date(b.createdAt);
        }

        return sortDirection.value === 'asc'
            ? valA > valB ? 1 : -1
            : valA < valB ? 1 : -1;
    });
});

// Вспомогательные методы
const switchTab = (tab) => {
    activeTab.value = tab;
};

const getStudentName = (studentId) => {
    const student = students.value.find(s => s._id === studentId);
    return student ? student.username : 'Неизвестный';
};

const getTaskName = (taskId) => {
    const task = tasks.value.find(t => t._id === taskId);
    return task ? task.name : 'Удалённый тест';
};

const getResultClass = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU');
};

const logout = async () => {
    try {
      await userStore.logout();
        router.push('/login');
    } catch (error) {
        alert('Ошибка выхода: ' + error.message);
    }
};

// Инициализация
onMounted(() => {
    loadInitialData();
});
</script>

<style scoped>
.teacher-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.dashboard-header {
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-info h1 {
    margin: 0;
    color: #2c3e50;
}

.logout-btn {
    background: #f5f5f5;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    color: #e74c3c;
}

.tabs {
    display: flex;
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
}

.tabs button {
    padding: 10px 20px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 16px;
}

.tabs button.active {
    border-bottom-color: #3498db;
    color: #3498db;
    font-weight: 500;
}

.tab-content {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* Стили для вкладки посещаемости */
.attendance-form h2 {
    margin-top: 0;
}

.student-list {
    margin: 20px 0;
}

.student-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
}

.student-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.student-name {
    font-size: 16px;
}

.attendance-status {
    padding: 5px 10px;
    border-radius: 12px;
    font-size: 14px;
    background: #f5f5f5;
    color: #666;
}

.attendance-status.present {
    background: #e8f5e9;
    color: #2e7d32;
}

.save-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

/* Стили для вкладки результатов */
.results-container h2 {
    margin-top: 0;
}

.filters {
    display: flex;
    gap: 15px;
    margin: 20px 0;
    align-items: flex-end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.filter-group label {
    font-size: 14px;
    color: #666;
}

.filter-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 200px;
}

.refresh-btn {
    background: #f5f5f5;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
}

.results-table-container {
    margin-top: 20px;
    overflow-x: auto;
}

.results-table {
    width: 100%;
    border-collapse: collapse;
}

.results-table th {
    background: #f8f9fa;
    padding: 12px 15px;
    text-align: left;
    cursor: pointer;
    user-select: none;
}

.results-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #eee;
}

.results-table tr:hover {
    background: #f8f9fa;
}

.excellent {
    color: #2e7d32;
    font-weight: 500;
}

.good {
    color: #689f38;
}

.average {
    color: #ff9800;
}

.poor {
    color: #e53935;
}

/* Стили для вкладки тестов */
.tasks-container h2 {
    margin-top: 0;
}

.tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.create-btn {
    background: #4caf50;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
}

.tasks-list {
    margin-top: 20px;
}

.task-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 6px;
    margin-bottom: 15px;
}

.task-info {
    width: 70%;
}

.task-info h3 {
    margin: 0 0 5px 0;
}

.task-description {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
}

.task-meta {
    display: flex;
    gap: 15px;
    font-size: 14px;
    color: #888;
}

.task-status {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
}

.task-status.active {
    background: #e8f5e9;
    color: #2e7d32;
}

.task-status:not(.active) {
    background: #fff3e0;
    color: #e65100;
}

.task-actions {
    display: flex;
    gap: 10px;
}

.edit-btn {
    background: #e3f2fd;
    color: #1976d2;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
}

.status-btn {
    background: #f5f5f5;
    color: #555;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
}

.status-btn.archive {
    background: #ffebee;
    color: #d32f2f;
}

.loading {
    text-align: center;
    padding: 30px;
    color: #666;
}

.no-tasks {
    text-align: center;
    padding: 30px;
    color: #888;
    font-style: italic;
}

@media (max-width: 768px) {
    .filters {
        flex-direction: column;
        align-items: flex-start;
    }

    .task-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .task-actions {
        width: 100%;
        justify-content: flex-end;
    }
}
</style>