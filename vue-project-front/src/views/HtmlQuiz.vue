<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()


// Получаем ID теста
const taskId = route.params.id

// Состояние теста
const testStarted = ref(false)
const testFinished = ref(false)
const currentQuestionIndex = ref(0)
const selectedOption = ref(null)
const timer = ref(null)
const timeLeft = ref(0)
const startTime = ref(0)
const questionResults = ref([])
const loading = ref(false)
const error = ref(null)
const testData = ref(null)
const progressFill = ref(null);

// Вопросы
const questions = ref([])

// Загрузка теста с сервера
const loadTest = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await api.get(`/tasks/${taskId}`)
    testData.value = response.data
    questions.value = testData.value.questions || []

    console.log('Загружен тест:', testData.value)

    // Автоматически начинаем тест после загрузки
    startTest()

  } catch (err) {
    console.error('Ошибка загрузки теста:', err)
    error.value = 'Не удалось загрузить тест. Попробуйте позже.'
  } finally {
    loading.value = false
  }
}

// Начало теста
const startTest = () => {
  if (questions.value.length === 0) {
    error.value = 'Тест не содержит вопросов'
    return
  }

  testStarted.value = true
  startTime.value = Date.now()
  startTimer()
}

// Таймер
const startTimer = () => {
  const totalTime = currentQuestion.value.timeLimit || 30;
  timeLeft.value = totalTime;

  if (timer.value) clearInterval(timer.value);

  const startTime = Date.now();
  const endTime = startTime + totalTime * 1000;

  timer.value = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    timeLeft.value = Math.ceil(remaining / 1000);

    const progressPercent = (remaining / (totalTime * 1000)) * 100;

    if (progressFill.value) {
      progressFill.value.style.width = `${progressPercent}%`;
    }

    if (remaining <= 0) {
      clearInterval(timer.value);
      timeUp();
    }
  }, 50); // Более частое обновление для плавности
};

const updateProgressBar = () => {
  const totalTime = currentQuestion.value.timeLimit || 30;
  const progressPercent = (timeLeft.value / totalTime) * 100;

  // Вариант 1: Через ref (лучший способ)
  if (progressFill.value) {
    progressFill.value.style.width = `${progressPercent}%`;
  }
};

// Время вышло
const timeUp = () => {
  clearInterval(timer.value);

  // Защита от ошибки при отсутствии текущего вопроса
  if (!currentQuestion.value) {
    finishTest();
    return;
  }

  questionResults.value.push({
    question: currentQuestion.value.text || 'Вопрос не загружен',
    userAnswer: 'Время вышло',
    correctAnswer: getCorrectAnswer(),
    correct: false,
    explanation: getExplanation()
  });

  nextQuestion();
};

// Вычисляемые свойства
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value]
})

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === questions.value.length - 1
})

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
})

const correctAnswers = computed(() => {
  return questionResults.value.filter(r => r.correct).length
})

const score = computed(() => {
  return questions.value.length > 0
      ? Math.round((correctAnswers.value / questions.value.length) * 100)
      : 0
})

const timeSpent = computed(() => {
  return Math.floor((Date.now() - startTime.value) / 1000)
})

// Вспомогательные методы
const getCorrectAnswer = () => {
  return currentQuestion.value?.options.find(o => o.correct)?.text || 'Не определено'
}

const getExplanation = () => {
  return currentQuestion.value?.options.find(o => o.correct)?.explanation || 'Объяснение отсутствует'
}

// Следующий вопрос
const nextQuestion = () => {
  // Сохраняем результат текущего вопроса
  if (selectedOption.value !== null && currentQuestion.value) {
    const isCorrect = currentQuestion.value.options[selectedOption.value]?.correct || false
    questionResults.value.push({
      question: currentQuestion.value.text,
      userAnswer: currentQuestion.value.options[selectedOption.value]?.text || 'Неизвестный ответ',
      correctAnswer: getCorrectAnswer(),
      correct: isCorrect,
      explanation: getExplanation()
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

// Завершение теста
const finishTest = () => {
  clearInterval(timer.value)
  testFinished.value = true
  testStarted.value = false
}

// Сохранение результатов
const saveResults = async () => {
  try {
    if (!userStore.user?._id) {
      throw new Error('Пользователь не авторизован');
    }

    const resultData = {
      userId: userStore.user._id,
      taskId: taskId,
      testName: testData.value?.name || 'Тест',
      difficulty: testData.value?.difficulty || 'medium',
      score: score.value,
      correctAnswers: correctAnswers.value,
      totalQuestions: questions.value.length,
      timeSpent: timeSpent.value,
      answers: questionResults.value.map(result => ({
        question: result.question,
        userAnswer: result.userAnswer,
        isCorrect: result.correct
      }))
    };

    console.log('Отправляемые данные:', JSON.stringify(resultData, null, 2));

    const response = await api.post('/results', resultData);

    if (response.status === 201) {
      alert('Результаты успешно сохранены!');
      router.push('/student');
    } else {
      throw new Error(response.data.message || 'Ошибка сохранения');
    }
  } catch (error) {
    console.error('Полная ошибка сохранения:', error);
    console.error('Ответ сервера:', error.response?.data);
    alert(`Ошибка сохранения: ${error.response?.data?.message || error.message}`);
  }
};

// Перезапуск теста
const restartTest = () => {
  // Полный сброс состояния
  currentQuestionIndex.value = 0;
  selectedOption.value = null;
  testStarted.value = true; // Начинаем тест сразу
  testFinished.value = false;
  questionResults.value = [];
  startTime.value = Date.now();

  // Сброс таймера
  clearInterval(timer.value);
  startTimer();

  // Прокрутка в начало
  window.scrollTo(0, 0);
};

// Возврат назад
const goBack = () => {
  if (testStarted.value && !testFinished.value) {
    if (!confirm('Вы уверены, что хотите прервать тест? Ваши результаты не будут сохранены.')) {
      return
    }
  }
  router.push('/student')
}

// Класс для оценки
const getScoreClass = (score) => {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'average'
  return 'poor'
}

// Загружаем тест при монтировании
onMounted(loadTest)

// Очистка таймера
onUnmounted(() => {
  clearInterval(timer.value)
})
</script>

<template>
  <div class="quiz-app">
    <!-- Загрузка -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Загрузка теста...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="error-screen">
      <p>{{ error }}</p>
      <button @click="loadTest" class="retry-btn">Попробовать снова</button>
      <button @click="goBack" class="back-btn">Вернуться</button>
    </div>

    <!-- Тест -->
    <div v-else-if="testStarted && !testFinished" class="test-screen">
      <div class="test-header">
        <h2>{{ testData?.name || 'Тест' }}</h2>
        <div class="progress-container">
          <div class="progress-bar">
            <div ref="progressFill" class="progress-fill"></div>
          </div>
          <div class="progress-labels">
            <span>Осталось: {{ formattedTime }}</span>
            <span>Вопрос {{ currentQuestionIndex + 1 }} из {{ questions.length }}</span>
          </div>
        </div>
      </div>

      <!-- Вопрос -->
      <div class="question-card">
        <div class="question-content">
          <h3 class="question-text">{{ currentQuestion.text }}</h3>

          <div class="options-grid">
            <div v-for="(option, index) in currentQuestion.options"
                 :key="index"
                 class="option-item"
                 :class="{'option-selected': selectedOption === index}"
                 @click="selectedOption = index">
              <input type="radio"
                     :id="'option-' + index"
                     :name="'question-' + currentQuestionIndex"
                     :value="index"
                     v-model="selectedOption"
                     class="option-input">
              <label :for="'option-' + index" class="option-label">
                <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
                <span class="option-text">{{ option.text }}</span>
              </label>
            </div>
          </div>
        </div>

        <button @click="nextQuestion"
                :disabled="selectedOption === null"
                class="next-question-btn">
          {{ isLastQuestion ? 'Завершить тест' : 'Следующий вопрос' }}
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>

    <!-- Результаты -->
    <div v-else-if="testFinished" class="results-screen">
      <div class="results-container">
        <div class="results-summary">
          <h3 class="results-title">Результаты теста</h3>
          <div class="results-stats">
            <div class="stat-card correct-stat">
              <div class="stat-value">{{ correctAnswers }}</div>
              <div class="stat-label">Правильных ответов</div>
            </div>
            <div class="stat-card total-stat">
              <div class="stat-value">{{ questions.length }}</div>
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
            <div v-for="(result, index) in questionResults"
                 :key="index"
                 class="answer-item"
                 :class="{'correct-answer': result.correct, 'wrong-answer': !result.correct}">
              <div class="answer-header">
                <span class="answer-question-number">Вопрос {{ index + 1 }}</span>
                <span class="answer-status">
                  {{ result.correct ? 'Правильно' : 'Неправильно' }}
                </span>
              </div>
              <p class="answer-question">{{ questions[index].text }}</p>
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
</template>

<style scoped>
/* Основные стили */
.quiz-app {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: #2c3e50;
}

/* Анимации */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Загрузка */
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

/* Ошибка */
.error-screen {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.error-screen p {
  color: #e53e3e;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.retry-btn, .back-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  margin: 0 0.5rem;
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
}

.retry-btn:hover {
  background: #2980b9;
}

.back-btn {
  background: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

/* Шапка теста */
.test-header {
  margin-bottom: 25px;
}

.timer-progress {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timer {
  font-size: 18px;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 10px;
}

.time-warning {
  color: #e74c3c;
}

.progress-container {
  margin: 15px 0;
}

.progress-bar {
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 5px;
  width: 100%;
  transition: width 0.5s linear;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 14px;
  color: #7f8c8d;
}

/* Карточка вопроса */
.question-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-out;
}

.question-text {
  font-size: 20px;
  margin-bottom: 25px;
  line-height: 1.4;
}

/* Варианты ответов */
.options-grid {
  display: grid;
  gap: 12px;
  margin-bottom: 30px;
}

.option-item {
  position: relative;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover {
  border-color: #3498db;
  background: #f8fafd;
}

.option-selected {
  border-color: #3498db;
  background: #f0f7ff;
  box-shadow: 0 0 0 1px rgba(52, 152, 219, 0.3);
}

.option-input {
  position: absolute;
  opacity: 0;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-marker {
  width: 24px;
  height: 24px;
  border: 2px solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.option-selected .option-marker {
  background: #3498db;
  border-color: #3498db;
  color: white;
}

.option-letter {
  font-weight: bold;
}

.option-text {
  flex: 1;
}

/* Кнопка следующего вопроса */
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
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.2);
}

.next-question-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
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

/* Разбор ответов */
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
  background: #f0fff4;
}

.wrong-answer {
  border-left: 4px solid #e74c3c;
  background: #fff5f5;
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

/* Кнопки действий */
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

/* Адаптивность */
@media (max-width: 768px) {
  .quiz-app {
    padding: 15px;
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
    padding: 10px;
  }

  .question-text {
    font-size: 18px;
  }

  .results-stats {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 15px;
  }
}
</style>