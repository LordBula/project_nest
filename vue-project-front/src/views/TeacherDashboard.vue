<template>
    <div class="teacher-dashboard">
        <h2>Добро пожаловать, преподаватель!</h2>

        <div class="tabs">
            <button
                @click="activeTab = 'attendance'"
                :class="{ active: activeTab === 'attendance' }"
            >
                Посещаемость
            </button>
            <button
                @click="activeTab = 'results'"
                :class="{ active: activeTab === 'results' }"
            >
                Результаты тестов
            </button>
        </div>

        <!-- Вкладка посещаемости -->
        <div v-if="activeTab === 'attendance'" class="attendance-form">
            <h3>Список студентов:</h3>
            <div v-for="student in students" :key="student._id" class="student-row">
                <label>
                    <input
                        type="checkbox"
                        v-model="student.present"
                        @change="updateAttendance(student)"
                    >
                    {{ student.username }}
                </label>
                <span class="status" :class="{ present: student.present }">
          {{ student.present ? 'Присутствовал' : 'Отсутствовал' }}
        </span>
            </div>

            <button @click="saveAllAttendance" class="save-btn">
                Сохранить посещаемость
            </button>
        </div>

        <!-- Вкладка результатов тестов -->
        <div v-if="activeTab === 'results'" class="test-results">
            <div class="filters">
                <select v-model="selectedStudent" class="filter-select">
                    <option value="">Все студенты</option>
                    <option v-for="student in students" :value="student._id">
                        {{ student.username }}
                    </option>
                </select>

                <select v-model="selectedTest" class="filter-select">
                    <option value="">Все тесты</option>
                    <option v-for="test in availableTests" :value="test">
                        {{ test }}
                    </option>
                </select>

                <button @click="refreshResults" class="refresh-btn">
                    Обновить
                </button>
            </div>

            <div v-if="loading" class="loading-indicator">
                Загрузка данных...
            </div>

            <div v-else-if="filteredResults.length === 0" class="no-results">
                Нет результатов для отображения
            </div>

            <table v-else class="results-table">
                <thead>
                <tr>
                    <th @click="sortResults('username')">Студент ▼</th>
                    <th @click="sortResults('testName')">Тест</th>
                    <th @click="sortResults('difficulty')">Уровень</th>
                    <th @click="sortResults('score')">Результат</th>
                    <th @click="sortResults('createdAt')">Дата</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="result in sortedResults" :key="result._id">
                    <td>{{ getStudentName(result.userId) }}</td>
                    <td>{{ result.testName }}</td>
                    <td>{{ formatDifficulty(result.difficulty) }}</td>
                    <td :class="getResultClass(result)">
                        {{ result.score }}% ({{ result.correctAnswers }}/{{ result.totalQuestions }})
                    </td>
                    <td>{{ formatDate(result.createdAt) }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

// Состояние компонента
const activeTab = ref('attendance')
const students = ref([])
const testResults = ref([])
const selectedStudent = ref('')
const selectedTest = ref('')
const loading = ref(false)
const sortField = ref('createdAt')
const sortDirection = ref('desc')

// Загрузка данных
const loadData = async () => {
    try {
        loading.value = true

        // Параллельная загрузка студентов и результатов
        const [studentsRes, resultsRes] = await Promise.all([
            api.get('/users', { params: { role: 'student' } }),
            api.get('/results/teacher')
        ])

        students.value = studentsRes.data
        testResults.value = resultsRes.data.data || []

    } catch (error) {
        console.error('Ошибка загрузки:', error)
        alert(`Ошибка загрузки: ${error.response?.data?.message || error.message}`)
    } finally {
        loading.value = false
    }
}

// Фильтрация и сортировка
const filteredResults = computed(() => {
    return testResults.value.filter(result => {
        const matchesStudent = selectedStudent.value
            ? result.userId === selectedStudent.value
            : true
        const matchesTest = selectedTest.value
            ? result.testName === selectedTest.value
            : true
        return matchesStudent && matchesTest
    })
})

const sortedResults = computed(() => {
    return [...filteredResults.value].sort((a, b) => {
        let valA = a[sortField.value]
        let valB = b[sortField.value]

        if (sortField.value === 'username') {
            valA = getStudentName(a.userId)
            valB = getStudentName(b.userId)
        }

        if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1
        if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1
        return 0
    })
})

const sortResults = (field) => {
    if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortField.value = field
        sortDirection.value = 'asc'
    }
}

// Вспомогательные функции
const getStudentName = (studentId) => {
    const student = students.value.find(s => s._id === studentId)
    return student ? student.username : `Студент (${studentId.slice(0, 4)})`
}

const formatDifficulty = (difficulty) => {
    const levels = { easy: 'Легкий', medium: 'Средний', hard: 'Сложный' }
    return levels[difficulty] || difficulty
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const getResultClass = (result) => {
    if (result.score >= 80) return 'excellent'
    if (result.score >= 60) return 'good'
    if (result.score >= 40) return 'average'
    return 'poor'
}

const refreshResults = () => {
    loadData()
}

const availableTests = computed(() => {
    return [...new Set(testResults.value.map(r => r.testName))]
})

// Методы для посещаемости
const updateAttendance = async (student) => {
    try {
        await api.post('/attendance', {
            studentId: student._id,
            status: student.present ? 'present' : 'absent',
            date: new Date().toISOString().split('T')[0]
        })
    } catch (error) {
        console.error('Ошибка сохранения:', error)
        student.present = !student.present
        alert('Не удалось сохранить посещаемость')
    }
}

const saveAllAttendance = async () => {
    try {
        await Promise.all(students.value.map(student =>
            api.post('/attendance', {
                studentId: student._id,
                status: student.present ? 'present' : 'absent',
                date: new Date().toISOString().split('T')[0]
            })
        ))
        alert('Посещаемость сохранена!')
    } catch (error) {
        console.error('Ошибка сохранения:', error)
        alert('Ошибка при сохранении посещаемости')
    }
}

// Инициализация
onMounted(() => {
    loadData()
})
</script>

<style scoped>
.teacher-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Arial', sans-serif;
}

.tabs {
    display: flex;
    margin: 25px 0;
    border-bottom: 1px solid #e0e0e0;
}

.tabs button {
    padding: 10px 25px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s;
}

.tabs button.active {
    border-bottom-color: #4CAF50;
    color: #4CAF50;
    font-weight: bold;
}

.tabs button:hover {
    background-color: #f5f5f5;
}

/* Стили для вкладки посещаемости */
.attendance-form {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.student-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
}

.student-row label {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.student-row input[type="checkbox"] {
    transform: scale(1.2);
}

.status {
    padding: 5px 12px;
    border-radius: 15px;
    font-size: 14px;
    font-weight: 500;
}

.status.present {
    background-color: #e8f5e9;
    color: #2e7d32;
}

.save-btn {
    margin-top: 20px;
    padding: 12px 25px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.save-btn:hover {
    background-color: #3d8b40;
}

/* Стили для вкладки результатов */
.test-results {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.filters {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    align-items: center;
}

.filter-select {
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 200px;
}

.refresh-btn {
    padding: 10px 15px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.refresh-btn:hover {
    background-color: #0b7dda;
}

.loading-indicator,
.no-results {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
}

.results-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.results-table th {
    background-color: #f5f5f5;
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
}

.results-table th:hover {
    background-color: #eee;
}

.results-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #eee;
}

.results-table tr:hover {
    background-color: #f9f9f9;
}

/* Стили для результатов */
.excellent {
    color: #2e7d32;
    font-weight: bold;
}

.good {
    color: #689f38;
}

.average {
    color: #ff9800;
}

.poor {
    color: #d32f2f;
    font-weight: bold;
}

/* Адаптивность */
@media (max-width: 768px) {
    .filters {
        flex-direction: column;
        align-items: flex-start;
    }

    .filter-select {
        width: 100%;
    }
}
</style>