import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import StudentDashboard from '../views/StudentDashboard.vue';
import TeacherDashboard from '../views/TeacherDashboard.vue';

const routes: RouteRecordRaw[] = [
    { path: '/login', component: LoginView },
    { path: '/register', component: RegisterView },
    { path: '/student', component: StudentDashboard },
    { path: '/teacher', component: TeacherDashboard },
    { path: '/', redirect: '/login' },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
