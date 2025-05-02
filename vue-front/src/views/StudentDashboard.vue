<template>
  <div>
    <h2>Добро пожаловать, студент!</h2>
    <h3>Задания по PHP:</h3>
    <ul>
      <li v-for="task in tasks" :key="task._id">
        {{ task.title }}
        <pre>{{ task.description }}</pre>
      </li>
    </ul>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import api from '../services/api';

const tasks = ref([]);

onMounted(async () => {
  const res = await api.get('/tasks');
  tasks.value = res.data;
});
</script>
