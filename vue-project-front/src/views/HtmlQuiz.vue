<template>
    <div class="quiz-app">
        <!-- Выбор уровня сложности -->
        <div v-if="!testStarted" class="difficulty-screen">
            <div class="difficulty-container">
                <h2 class="difficulty-title">Выберите уровень сложности</h2>
                <p class="difficulty-subtitle">Тест: HTML Quiz</p>

                <div class="difficulty-options">
                    <button
                        v-for="level in difficultyLevels"
                        :key="level.value"
                        @click="startTest(level.value)"
                        class="difficulty-btn"
                        :class="'difficulty-' + level.value"
                    >
                        <span class="difficulty-label">{{ level.label }}</span>
                        <span class="difficulty-info">
                            {{ getDifficultyInfo(level.value) }}
                        </span>
                    </button>
                </div>

                <button @click="goBack" class="solid-back-btn">
                    Назад
                </button>
            </div>
        </div>

        <!-- Тест -->
        <div v-if="testStarted && !testFinished" class="test-screen">
            <div class="test-header">
                <div class="timer-progress">
                    <div class="timer" :class="{'time-warning': timeLeft <= 10}">
                        <i class="fas fa-clock"></i> {{ formattedTime }}
                    </div>
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            :style="{ width: ((currentQuestionIndex + 1) / filteredQuestions.length) * 100 + '%' }"
                        ></div>
                    </div>
                    <div class="progress-text">
                        Вопрос {{ currentQuestionIndex + 1 }} из {{ filteredQuestions.length }}
                    </div>
                </div>
            </div>

            <div class="question-card">
                <div class="question-content">
                    <h3 class="question-text">{{ currentQuestion.text }}</h3>

                    <div class="options-grid">
                        <div
                            v-for="(option, index) in currentQuestion.options"
                            :key="index"
                            class="option-item"
                            :class="{'option-selected': selectedOption === index}"
                            @click="selectedOption = index"
                        >
                            <input
                                type="radio"
                                :id="'option-' + index"
                                :name="'question-' + currentQuestionIndex"
                                :value="index"
                                v-model="selectedOption"
                                class="option-input"
                            >
                            <label :for="'option-' + index" class="option-label">
                                <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
                                <span class="option-text">{{ option.text }}</span>
                            </label>
                        </div>
                    </div>
                </div>

                <button
                    @click="nextQuestion"
                    :disabled="selectedOption === null"
                    class="next-question-btn"
                >
                    {{ isLastQuestion ? 'Завершить тест' : 'Следующий вопрос' }}
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>

        <!-- Результаты -->
        <div v-if="testFinished" class="results-screen">
            <div class="results-container">
                <div class="results-summary">
                    <h3 class="results-title">Результаты теста</h3>
                    <div class="results-stats">
                        <div class="stat-card correct-stat">
                            <div class="stat-value">{{ correctAnswers }}</div>
                            <div class="stat-label">Правильных ответов</div>
                        </div>
                        <div class="stat-card total-stat">
                            <div class="stat-value">{{ filteredQuestions.length }}</div>
                            <div class="stat-label">Всего вопросов</div>
                        </div>
                        <div class="stat-card score-stat" :class="getScoreClass(score)">
                            <div class="stat-value">{{ score }}%</div>
                            <div class="stat-label">Общий результат</div>
                        </div>
                        <div class="stat-card time-stat">
                            <div class="stat-value">{{ timeSpent }}</div>
                            <div class="stat-label">Секунд</div>
                        </div>
                    </div>
                </div>

                <div class="results-details">
                    <h4 class="details-title">
                        <i class="fas fa-chart-bar"></i> Разбор ответов
                    </h4>

                    <div class="answers-list">
                        <div
                            v-for="(result, index) in questionResults"
                            :key="index"
                            class="answer-item"
                            :class="{'correct-answer': result.correct, 'wrong-answer': !result.correct}"
                        >
                            <div class="answer-header">
                                <span class="answer-question-number">Вопрос {{ index + 1 }}</span>
                                <span class="answer-status">
                                    {{ result.correct ? 'Правильно' : 'Неправильно' }}
                                </span>
                            </div>
                            <p class="answer-question">{{ filteredQuestions[index].text }}</p>
                            <div class="answer-comparison">
                                <div class="user-answer">
                                    <span>Ваш ответ:</span> {{ result.userAnswer }}
                                </div>
                                <div class="correct-answer" v-if="!result.correct">
                                    <span>Правильный ответ:</span> {{ result.correctAnswer }}
                                </div>
                            </div>
                            <p class="answer-explanation">
                                <i class="fas fa-info-circle"></i> {{ result.explanation }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="results-actions">
                    <button @click="saveResults" class="action-btn save-btn">
                        <i class="fas fa-save"></i> Сохранить результаты
                    </button>
                    <button @click="restartTest" class="action-btn restart-btn">
                        <i class="fas fa-redo"></i> Пройти снова
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Загрузка теста...</p>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// Получаем ID теста из параметров маршрута
const taskId = route.params.id

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
const loading = ref(false)
const error = ref(null)

// Вопросы теперь будут загружаться с сервера
const questions = ref({
    easy: [],
    medium: [],
    hard: []
})

// Загрузка теста с сервера
const loadTest = async () => {
    try {
        loading.value = true
        error.value = null
        const response = await api.get(`/tasks/${taskId}`)

        // Преобразуем данные с сервера в нужный формат
        questions.value = {
            easy: transformQuestions(response.data.questions.easy),
            medium: transformQuestions(response.data.questions.medium),
            hard: transformQuestions(response.data.questions.hard)
        }
    } catch (err) {
        error.value = 'Не удалось загрузить тест'
        console.error('Ошибка загрузки теста:', err)
    } finally {
        loading.value = false
    }
}

// Вспомогательная функция для преобразования вопросов
const transformQuestions = (serverQuestions) => {
    return serverQuestions.map(q => ({
        text: q.questionText,
        options: q.options.map((opt, idx) => ({
            text: opt.text,
            correct: idx === q.correctOption,
            explanation: opt.explanation || 'Объяснение отсутствует'
        })),
        timeLimit: q.timeLimit || 30
    }))
}

// Вычисляемые свойства
const filteredQuestions = computed(() => questions.value[currentDifficulty.value])
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
    return filteredQuestions.value.length > 0
        ? Math.round((correctAnswers.value / filteredQuestions.value.length) * 100)
        : 0
})

// Загружаем тест при монтировании компонента
onMounted(() => {
    loadTest()
})

// Методы
const goBack = () => {
    if (testStarted.value && !testFinished.value) {
        if (!confirm('Вы уверены, что хотите прервать тест? Ваши результаты не будут сохранены.')) {
            return
        }
    }
    router.push('/student')
}

const getDifficultyInfo = (difficulty) => {
    const info = {
        easy: "30 секунд на вопрос",
        medium: "20 секунд на вопрос",
        hard: "15 секунд на вопрос"
    }
    return info[difficulty]
}

const getScoreClass = (score) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'average'
    return 'poor'
}

const startTest = (difficulty) => {
    if (filteredQuestions.value.length === 0) {
        alert('Нет вопросов для этого уровня сложности')
        return
    }

    currentDifficulty.value = difficulty
    testStarted.value = true
    startTime.value = Date.now()
    startTimer()
}

const startTimer = () => {
    if (!currentQuestion.value) return

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
    if (currentQuestion.value) {
        questionResults.value.push({
            question: currentQuestion.value.text,
            userAnswer: 'Время вышло',
            correctAnswer: currentQuestion.value.options.find(o => o.correct)?.text || 'Не определено',
            correct: false,
            explanation: currentQuestion.value.options.find(o => o.correct)?.explanation || 'Объяснение отсутствует'
        })
    }
    nextQuestion()
}

const nextQuestion = () => {
    // Сохраняем результат текущего вопроса
    if (selectedOption.value !== null && currentQuestion.value) {
        const isCorrect = currentQuestion.value.options[selectedOption.value]?.correct || false
        questionResults.value.push({
            question: currentQuestion.value.text,
            userAnswer: currentQuestion.value.options[selectedOption.value]?.text || 'Неизвестный ответ',
            correctAnswer: currentQuestion.value.options.find(o => o.correct)?.text || 'Не определено',
            correct: isCorrect,
            explanation: currentQuestion.value.options.find(o => o.correct)?.explanation || 'Объяснение отсутствует'
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
        if (!userStore.user?._id) {
            throw new Error('Пользователь не авторизован')
        }

        const resultData = {
            userId: userStore.user._id,
            taskId: taskId,
            testName: 'HTML Quiz',
            difficulty: currentDifficulty.value,
            score: score.value,
            correctAnswers: correctAnswers.value,
            totalQuestions: filteredQuestions.value.length,
            timeSpent: timeSpent.value,
            answers: questionResults.value.map(result => ({
                question: result.question,
                userAnswer: result.userAnswer,
                isCorrect: result.correct
            }))
        }

        const response = await api.post('/results', resultData)

        if (response.data.success) {
            alert('Результаты успешно сохранены!')
            router.push('/student')
        } else {
            throw new Error(response.data.message || 'Не удалось сохранить результаты')
        }
    } catch (error) {
        console.error('Ошибка сохранения результатов:', error)
        alert(`Ошибка: ${error.response?.data?.message || error.message}`)
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
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.loading-spinner {
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
/* Основные стили */
.quiz-app {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    color: #2c3e50;
}

/* Экран выбора сложности */
.difficulty-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 70vh;
}

.difficulty-container {
    background: white;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
    text-align: center;
}

.difficulty-title {
    font-size: 28px;
    margin-bottom: 8px;
    color: #3498db;
}

.difficulty-subtitle {
    font-size: 16px;
    color: #7f8c8d;
    margin-bottom: 30px;
}

.difficulty-options {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.difficulty-btn {
    border: none;
    border-radius: 12px;
    padding: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    display: flex;
    flex-direction: column;
    color: white;
}

.difficulty-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.difficulty-easy {
    background: linear-gradient(135deg, #2ecc71, #27ae60);
}

.difficulty-medium {
    background: linear-gradient(135deg, #f39c12, #e67e22);
}

.difficulty-hard {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.difficulty-label {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
}

.difficulty-info {
    font-size: 14px;
    opacity: 0.9;
}

/* Экран теста */
.test-header {
    margin-bottom: 30px;
}

.timer-progress {
    background: white;
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.timer {
    font-size: 18px;
    font-weight: bold;
    color: #3498db;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.time-warning {
    color: #e74c3c;
}

.progress-bar {
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    margin-bottom: 8px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2ecc71);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 14px;
    color: #7f8c8d;
}

.question-card {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.question-text {
    font-size: 20px;
    margin-bottom: 25px;
    line-height: 1.4;
}

.options-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 30px;
}

.option-item {
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.option-selected {
    border-color: #3498db;
    background-color: #f8fafd;
}

.option-input {
    display: none;
}

.option-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.option-letter {
    width: 30px;
    height: 30px;
    background: #f0f0f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #7f8c8d;
    transition: all 0.2s ease;
}

.option-selected .option-letter {
    background: #3498db;
    color: white;
}

.option-text {
    flex: 1;
}

.next-question-btn {
    background: linear-gradient(135deg, #3498db, #2ecc71);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 15px 25px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    transition: all 0.3s ease;
}

.next-question-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.next-question-btn:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Экран результатов */
.results-screen {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.results-container {
    padding: 30px;
}

.results-title {
    font-size: 24px;
    color: #3498db;
    margin-bottom: 20px;
    text-align: center;
}

.results-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-value {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 14px;
    color: #7f8c8d;
}

.correct-stat .stat-value {
    color: #2ecc71;
}

.total-stat .stat-value {
    color: #3498db;
}

.score-stat.excellent .stat-value {
    color: #2ecc71;
}

.score-stat.good .stat-value {
    color: #f39c12;
}

.score-stat.average .stat-value {
    color: #e67e22;
}

.score-stat.poor .stat-value {
    color: #e74c3c;
}

.time-stat .stat-value {
    color: #9b59b6;
}

.details-title {
    font-size: 20px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #2c3e50;
}

.answers-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.answer-item {
    border-radius: 12px;
    padding: 20px;
    background: #f9f9f9;
}

.correct-answer {
    border-left: 4px solid #2ecc71;
}

.wrong-answer {
    border-left: 4px solid #e74c3c;
}

.answer-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-weight: bold;
}

.answer-question-number {
    color: #3498db;
}

.answer-status {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
}

.correct-answer .answer-status {
    background: #d5f5e3;
    color: #27ae60;
}

.wrong-answer .answer-status {
    background: #fadbd8;
    color: #c0392b;
}

.answer-question {
    margin-bottom: 12px;
    line-height: 1.5;
}

.answer-comparison {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
}

.user-answer span, .correct-answer span {
    font-weight: bold;
}

.answer-explanation {
    padding: 12px;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    color: #555;
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.results-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
}

.action-btn {
    border: none;
    border-radius: 12px;
    padding: 12px 25px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.save-btn {
    background: #3498db;
    color: white;
}

.save-btn:hover {
    background: #2980b9;
    transform: translateY(-2px);
}

.restart-btn {
    background: #f1f1f1;
    color: #2c3e50;
}

.restart-btn:hover {
    background: #e0e0e0;
    transform: translateY(-2px);
}

/* Стили для блока выбора сложности с кнопкой назад */
.solid-back-btn {
    width: 100%;
    max-width: 200px;
    margin: 30px auto 0;
    padding: 12px 20px;
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: block;
    text-align: center;
}

.solid-back-btn:hover {
    background: #e9ecef;
    border-color: #d0d0d0;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Адаптивность */
@media (max-width: 768px) {
    .solid-back-btn {
        max-width: 160px;
        padding: 10px 16px;
        margin-top: 25px;
    }
}

@media (max-width: 480px) {
    .solid-back-btn {
        max-width: 140px;
        font-size: 15px;
    }
}

@media (max-width: 480px) {
    .difficulty-title {
        font-size: 18px;
    }
}

@media (max-width: 768px) {
    .difficulty-container {
        padding: 25px;
    }

    .question-card {
        padding: 20px;
    }

    .results-stats {
        grid-template-columns: 1fr 1fr;
    }

    .results-actions {
        flex-direction: column;
    }

    .action-btn {
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .quiz-app {
        padding: 15px;
    }

    .difficulty-container {
        padding: 20px 15px;
    }

    .difficulty-title {
        font-size: 24px;
    }

    .question-text {
        font-size: 18px;
    }

    .results-stats {
        grid-template-columns: 1fr;
    }
}
</style>