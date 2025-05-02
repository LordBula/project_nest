<template>
    <div>
        <h2>Добро пожаловать, преподаватель! </h2>
        <h3>Список студентов:</h3>

        <div class="attendance-form">
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
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const students = ref([]);

// Загрузка студентов и их посещаемости
onMounted(async () => {
    try {
        console.log('Начало загрузки студентов...'); // Логирование
        const response = await api.get('/users', {
            params: {
                role: 'student'
            }
        });
        console.log('Ответ сервера:', response.data); // Логирование

        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Некорректный формат данных');
        }

        students.value = response.data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Ошибка при загрузке студентов: ' + error.message);
    }
});

// Обновление статуса одного студента
const updateAttendance = async (student) => {
    try {
        await api.post('/attendance', {
            studentId: student._id,
            status: student.present ? 'present' : 'absent',
            date: new Date().toISOString().split('T')[0] // Формат YYYY-MM-DD
        });
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        // Откатываем изменение при ошибке
        student.present = !student.present;
    }
};

// Массовое сохранение
const saveAllAttendance = async () => {
    try {
        const promises = students.value.map(student =>
            api.post('/attendance', {
                studentId: student._id,
                status: student.present ? 'present' : 'absent',
                date: new Date().toISOString().split('T')[0]
            })
        );

        await Promise.all(promises);
        alert('Посещаемость сохранена!');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('Ошибка при сохранении');
    }
};
</script>

<style scoped>
.attendance-form {
    max-width: 600px;
    margin: 20px auto;
}

.student-row {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.student-row label {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.status {
    margin-left: 15px;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.9em;
}

.status.present {
    background-color: #e6f7e6;
    color: #2e7d32;
}

.save-btn {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.save-btn:hover {
    background-color: #45a049;
}
</style>