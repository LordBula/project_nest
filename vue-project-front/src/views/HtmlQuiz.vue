<template>
    <div class="quiz-container">
        <!-- Выбор уровня сложности -->
        <div v-if="!testStarted" class="difficulty-selector">
            <h2>Выберите уровень сложности:</h2>
            <button
                v-for="level in difficultyLevels"
                :key="level.value"
                @click="startTest(level.value)"
            >
                {{ level.label }}
            </button>
        </div>

        <!-- Таймер и прогресс -->
        <div v-if="testStarted" class="quiz-header">
            <div class="timer">
                Осталось времени: {{ formattedTime }}
            </div>
            <div class="progress">
                Вопрос {{ currentQuestionIndex + 1 }} из {{ filteredQuestions.length }}
            </div>
        </div>

        <!-- Вопросы -->
        <div v-if="testStarted && !testFinished" class="question-container">
            <div class="question">
                <h3>{{ currentQuestion.text }}</h3>
                <div v-for="(option, index) in currentQuestion.options" :key="index" class="option">
                    <input
                        type="radio"
                        :id="'option-' + index"
                        :name="'question-' + currentQuestionIndex"
                        :value="index"
                        v-model="selectedOption"
                    >
                    <label :for="'option-' + index">{{ option.text }}</label>
                </div>
            </div>

            <button @click="nextQuestion" :disabled="selectedOption === null" class="next-btn">
                {{ isLastQuestion ? 'Завершить тест' : 'Следующий вопрос' }}
            </button>
        </div>

        <!-- Результаты -->
        <div v-if="testFinished" class="results">
            <h3>Результаты теста</h3>
            <p>Правильных ответов: {{ correctAnswers }} из {{ filteredQuestions.length }}</p>
            <p>Ваш результат: {{ score }}%</p>
            <p>Затраченное время: {{ timeSpent }} секунд</p>

            <div class="explanations">
                <h4>Разбор ответов:</h4>
                <div v-for="(result, index) in questionResults" :key="index" class="explanation">
                    <p><strong>Вопрос {{ index + 1 }}:</strong> {{ filteredQuestions[index].text }}</p>
                    <p :class="{'correct': result.correct, 'incorrect': !result.correct}">
                        Ваш ответ: {{ result.userAnswer }} |
                        Правильный ответ: {{ result.correctAnswer }}
                    </p>
                    <p class="explanation-text">{{ result.explanation }}</p>
                </div>
            </div>

            <button @click="saveResults" class="save-btn">Сохранить результаты</button>
            <button @click="restartTest" class="restart-btn">Пройти тест снова</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import api from '@/services/api'
import { useUserStore } from '@/stores/user' // Убедитесь в правильности пути
const userStore = useUserStore()

const difficultyLevels = [
    { value: 'easy', label: 'Легкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'hard', label: 'Сложный' }
]

const questions = {
    easy: [
        {
            text: "Какой тег используется для создания заголовка первого уровня?",
            options: [
                { text: "<h1>", correct: true, explanation: "Тег <h1> используется для заголовков самого высокого уровня." },
                { text: "<head>", correct: false, explanation: "<head> содержит метаинформацию о документе." },
                { text: "<header>", correct: false, explanation: "<header> представляет вводную часть секции." }
            ],
            timeLimit: 30
        }
    ],
    medium: [
        {
            text: "Какой атрибут делает поле ввода обязательным?",
            options: [
                { text: "required", correct: true, explanation: "Атрибут required указывает, что поле должно быть заполнено перед отправкой формы." },
                { text: "placeholder", correct: false, explanation: "placeholder показывает подсказку в поле ввода." }
            ],
            timeLimit: 20
        }
    ],
    hard: [
        {
            text: "Какой элемент HTML5 предназначен для рисования графики?",
            options: [
                { text: "<canvas>", correct: true, explanation: "<canvas> используется для рисования графики через JavaScript." },
                { text: "<svg>", correct: false, explanation: "<svg> предназначен для векторной графики, но не является частью canvas API." }
            ],
            timeLimit: 15
        }
    ]
}

// Состояние теста
const testStarted = ref(false)
const testFinished = ref(false)
const currentDifficulty = ref('easy')
const currentQuestionIndex = ref(0)
const selectedOption = ref(null)
const timer = ref(null)
const timeLeft = ref(0)
const startTime = ref(0)
const questionResults = ref([])

// Вычисляемые свойства
const filteredQuestions = computed(() => questions[currentDifficulty.value])
const currentQuestion = computed(() => filteredQuestions.value[currentQuestionIndex.value])
const isLastQuestion = computed(() => currentQuestionIndex.value === filteredQuestions.value.length - 1)
const formattedTime = computed(() => {
    const minutes = Math.floor(timeLeft.value / 60)
    const seconds = timeLeft.value % 60
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
})
const timeSpent = computed(() => {
    return Math.floor((Date.now() - startTime.value) / 1000)
})

const correctAnswers = computed(() => {
    return questionResults.value.filter(r => r.correct).length
})

const score = computed(() => {
    return Math.round((correctAnswers.value / filteredQuestions.value.length) * 100)
})

// Методы
const startTest = (difficulty) => {
    currentDifficulty.value = difficulty
    testStarted.value = true
    startTime.value = Date.now()
    startTimer()
}

const startTimer = () => {
    timeLeft.value = currentQuestion.value.timeLimit
    timer.value = setInterval(() => {
        timeLeft.value--
        if (timeLeft.value <= 0) {
            timeUp()
        }
    }, 1000)
}

const timeUp = () => {
    clearInterval(timer.value)
    questionResults.value.push({
        question: currentQuestion.value.text,
        userAnswer: 'Время вышло',
        correctAnswer: currentQuestion.value.options.find(o => o.correct).text,
        correct: false,
        explanation: currentQuestion.value.options.find(o => o.correct).explanation
    })
    nextQuestion()
}

const nextQuestion = () => {
    // Сохраняем результат текущего вопроса
    if (selectedOption.value !== null) {
        const isCorrect = currentQuestion.value.options[selectedOption.value].correct
        questionResults.value.push({
            question: currentQuestion.value.text,
            userAnswer: currentQuestion.value.options[selectedOption.value].text,
            correctAnswer: currentQuestion.value.options.find(o => o.correct).text,
            correct: isCorrect,
            explanation: currentQuestion.value.options.find(o => o.correct).explanation
        })
    }

    // Переход к следующему вопросу или завершение
    if (isLastQuestion.value) {
        finishTest()
    } else {
        currentQuestionIndex.value++
        selectedOption.value = null
        clearInterval(timer.value)
        startTimer()
    }
}

const finishTest = () => {
    clearInterval(timer.value)
    testFinished.value = true
    testStarted.value = false
}

const saveResults = async () => {
    try {
        const response = await api.post('/results', {
            userId: userStore.user?._id || 'anonymous',
            testName: 'HTML Quiz',
            difficulty: currentDifficulty.value,
            score: score.value,
            correctAnswers: correctAnswers.value,
            totalQuestions: filteredQuestions.value.length,
            timeSpent: timeSpent.value,
            details: questionResults.value
        });

        if (response.data.success) {
            alert('Результаты успешно сохранены!');
        } else {
            alert(`Ошибка: ${response.data.message}`);
        }
    } catch (error) {
        console.error('Full error:', error);
        alert(`Не удалось сохранить результаты. Подробности: ${error.response?.data?.message || error.message}`);
    }
}

const restartTest = () => {
    currentQuestionIndex.value = 0
    selectedOption.value = null
    testFinished.value = false
    questionResults.value = []
}

// Очистка таймера при размонтировании
onUnmounted(() => {
    clearInterval(timer.value)
})
</script>

<style scoped>
/* Стили остаются аналогичными предыдущим, с добавлением новых элементов */
.timer {
    font-weight: bold;
    color: #e74c3c;
    margin-bottom: 10px;
}

.progress {
    color: #7f8c8d;
    margin-bottom: 20px;
}

.explanation {
    margin-bottom: 20px;
    padding: 10px;
    border-left: 3px solid #42b983;
}

.correct {
    color: #42b983;
}

.incorrect {
    color: #e74c3c;
}

.explanation-text {
    color: #555;
    font-style: italic;
}

.difficulty-selector {
    text-align: center;
}

.difficulty-selector button {
    margin: 10px;
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.difficulty-selector button:hover {
    background-color: #2980b9;
}
</style>