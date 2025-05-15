<template>
    <div class="create-task-form">
        <h3>{{ editing ? 'Редактирование теста' : 'Создание нового теста' }}</h3>

        <form @submit.prevent="submitForm">
            <div class="form-group">
                <label>Название теста*</label>
                <input v-model="form.name" required>
            </div>

            <div class="form-group">
                <label>Описание</label>
                <textarea v-model="form.description"></textarea>
            </div>

            <div class="form-group">
              <label>Общая сложность теста*</label>
              <select v-model="form.difficulty" required>
                <option value="easy">Легкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </select>
            </div>

            <div class="questions-list">
                <div v-for="(question, qIndex) in form.questions" :key="qIndex" class="question-item">
                    <div class="question-header">
                        <h4>Вопрос {{ qIndex + 1 }}</h4>
                        <button
                            type="button"
                            @click="removeQuestion(qIndex)"
                            class="remove-btn"
                            v-if="form.questions.length > 1"
                        >
                            Удалить вопрос
                        </button>
                    </div>

                    <div class="form-group">
                        <label>Текст вопроса*</label>
                        <input v-model="question.text" required>
                    </div>

                    <div class="form-row">


                        <div class="form-group">
                            <label>Лимит времени (сек)*</label>
                            <input
                                type="number"
                                v-model="question.timeLimit"
                                min="10"
                                required
                            >
                        </div>
                    </div>

                    <div class="options-list">
                        <div v-for="(option, oIndex) in question.options" :key="oIndex" class="option-item">
                            <div class="option-header">
                                <label class="correct-option">
                                    <input
                                        type="radio"
                                        :name="'correct-option-' + qIndex"
                                        :checked="option.correct"
                                        @change="setCorrectOption(qIndex, oIndex)"
                                    >
                                    Верный ответ
                                </label>

                                <button
                                    type="button"
                                    @click="removeOption(qIndex, oIndex)"
                                    class="remove-btn small"
                                    v-if="question.options.length > 2"
                                >
                                    Удалить
                                </button>
                            </div>

                            <input
                                v-model="option.text"
                                placeholder="Текст варианта*"
                                required
                            >

                            <textarea
                                v-model="option.explanation"
                                placeholder="Объяснение ответа"
                            ></textarea>
                        </div>

                        <button
                            type="button"
                            @click="addOption(qIndex)"
                            class="add-btn"
                        >
                            + Добавить вариант
                        </button>
                    </div>
                </div>
            </div>
          <button type="button" @click="addQuestion" class="add-btn">
            + Добавить вопрос
          </button>

            <div class="form-actions">
                <button type="button" @click="cancel" class="cancel-btn">
                    Отмена
                </button>
                <button type="submit" class="submit-btn">
                    {{ editing ? 'Сохранить изменения' : 'Создать тест' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const props = defineProps({
    taskId: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['save', 'cancel']);

const editing = ref(false);
const form = ref({
  name: '',
  description: '',
  difficulty: 'medium', // Добавляем поле для общей сложности
  questions: [
    {
      text: '',
      options: [
        { text: '', correct: true, explanation: '' },
        { text: '', correct: false, explanation: '' }
      ],
      difficulty: 'easy', // Сложность отдельного вопроса
      timeLimit: 30
    }
  ]
});

// Загрузка теста для редактирования
onMounted(async () => {
  if (props.taskId) {
    try {
      const response = await api.get(`/tasks/${props.taskId}`);
      form.value = {
        ...response.data, // предполагая, что сервер возвращает данные напрямую
        difficulty: response.data.difficulty || 'medium'
      };
      editing.value = true;
    } catch (error) {
      alert('Не удалось загрузить тест: ' + error.message);
      emit('cancel');
    }
  }
});

const addQuestion = () => {
    form.value.questions.push({
        text: '',
        options: [
            { text: '', correct: true, explanation: '' },
            { text: '', correct: false, explanation: '' }
        ],
        timeLimit: 30
    });
};

const removeQuestion = (index) => {
    if (form.value.questions.length > 1) {
        form.value.questions.splice(index, 1);
    }
};

const addOption = (qIndex) => {
    form.value.questions[qIndex].options.push({
        text: '',
        correct: false,
        explanation: ''
    });
};

const removeOption = (qIndex, oIndex) => {
    if (form.value.questions[qIndex].options.length > 2) {
        form.value.questions[qIndex].options.splice(oIndex, 1);
    }
};

const setCorrectOption = (qIndex, oIndex) => {
    form.value.questions[qIndex].options.forEach((opt, idx) => {
        opt.correct = idx === oIndex;
    });
};

const validateForm = () => {
    // Проверяем, что в каждом вопросе есть хотя бы один правильный ответ
    const hasInvalidQuestions = form.value.questions.some(question => {
        return !question.options.some(opt => opt.correct);
    });

    if (hasInvalidQuestions) {
        throw new Error('В каждом вопросе должен быть хотя бы один правильный вариант ответа');
    }

    // Проверяем, что все обязательные поля заполнены
    if (!form.value.name) {
        throw new Error('Название теста обязательно');
    }

    for (const question of form.value.questions) {
        if (!question.text) {
            throw new Error('Текст вопроса обязателен');
        }

        for (const option of question.options) {
            if (!option.text) {
                throw new Error('Текст варианта ответа обязателен');
            }
        }
    }
};

const submitForm = async () => {
    try {
        validateForm();

        if (editing.value) {
            await api.patch(`/tasks/${props.taskId}`, form.value);
        } else {
            await api.post('/tasks', form.value);
        }

        emit('save');
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

const cancel = () => {
    emit('cancel');
};
</script>

<style scoped>
.create-task-form {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
}

.create-task-form h3 {
    margin-top: 0;
    color: #2c3e50;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
}

.form-group textarea {
    min-height: 80px;
    resize: vertical;
}

.form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

.form-row .form-group {
    flex: 1;
    margin-bottom: 0;
}

.questions-list {
    margin-top: 30px;
}

.question-item {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 6px;
    margin-bottom: 25px;
}

.question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.question-header h4 {
    margin: 0;
    color: #3498db;
}

.options-list {
    margin-top: 20px;
}

.option-item {
    background: white;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 15px;
    border: 1px solid #eee;
}

.option-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.correct-option {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #555;
}

.option-item input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 10px;
}

.option-item textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    min-height: 60px;
}

.add-btn {
    background: #e3f2fd;
    color: #1976d2;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 10px;
    transition: background 0.2s;
}

.add-btn:hover {
    background: #bbdefb;
}

.remove-btn {
    background: #ffebee;
    color: #d32f2f;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

.remove-btn.small {
    padding: 3px 8px;
    font-size: 12px;
}

.remove-btn:hover {
    background: #ffcdd2;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.cancel-btn {
    background: #f5f5f5;
    color: #555;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}

.submit-btn {
    background: #4caf50;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.submit-btn:hover {
    background: #3d8b40;
}

@media (max-width: 768px) {
    .form-row {
        flex-direction: column;
        gap: 0;
    }
}
</style>