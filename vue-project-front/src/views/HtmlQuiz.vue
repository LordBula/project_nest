<template>
    <div class="quiz-container">
        <h2>Тест по HTML</h2>
        <div v-for="(question, index) in questions" :key="index" class="question">
            <h3>{{ question.text }}</h3>
            <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option">
                <input
                    type="radio"
                    :id="'q'+index+'-opt'+optIndex"
                    :name="'question'+index"
                    :value="option"
                    v-model="answers[index]"
                >
                <label :for="'q'+index+'-opt'+optIndex">{{ option }}</label>
            </div>
        </div>

        <button @click="checkAnswers" class="submit-btn">Проверить ответы</button>

        <div v-if="showResults" class="results">
            <h3>Результаты:</h3>
            <p>Правильных ответов: {{ correctAnswers }}</p>
            <p>Неправильных ответов: {{ incorrectAnswers }}</p>
            <p>Ваш результат: {{ score }}%</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const questions = ref([
    {
        text: "Какой тег используется для создания заголовка первого уровня?",
        options: ["<h1>", "<head>", "<header>", "<title>"],
        correct: 0
    },
    {
        text: "Какой атрибут делает поле ввода обязательным?",
        options: ["required", "placeholder", "validate", "mandatory"],
        correct: 0
    },
    {
        text: "Как создать ненумерованный список?",
        options: ["<ul>", "<ol>", "<list>", "<dl>"],
        correct: 0
    }
])

const answers = ref([])
const showResults = ref(false)

const correctAnswers = computed(() => {
    return answers.value.filter((answer, index) => {
        return answer === questions.value[index].options[questions.value[index].correct]
    }).length
})

const incorrectAnswers = computed(() => {
    return questions.value.length - correctAnswers.value
})

const score = computed(() => {
    return Math.round((correctAnswers.value / questions.value.length) * 100)
})

const checkAnswers = () => {
    showResults.value = true
}
</script>

<style scoped>
.quiz-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.question {
    margin-bottom: 30px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 8px;
}

.option {
    margin: 10px 0;
}

.option input {
    margin-right: 10px;
}

.submit-btn {
    background-color: #42b983;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.submit-btn:hover {
    background-color: #369f6b;
}

.results {
    margin-top: 30px;
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 8px;
}
</style>