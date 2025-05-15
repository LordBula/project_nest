import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import StudentDashboard from "@/views/StudentDashboard.vue";
import TeacherDashboard from "@/views/TeacherDashboard.vue";
import {useUserStore} from "@/stores/user";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'home',
        component: LoginView
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterView,
        meta: { requiresAuth: false }
    },
    {
        path: '/student',
        name: 'student',
        component: StudentDashboard,
        meta: { requiresAuth: true, role: 'student' }
    },
    {
        path: '/teacher',
        name: 'teacher',
        component: TeacherDashboard,
        meta: { requiresAuth: true, role: 'teacher' }
    },
    {
        path: '/html-quiz/:id',
        name: 'HtmlQuiz',
        component: () => import('@/views/HtmlQuiz.vue'),
        props: true // Это позволит передавать параметр как props
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()

    if (to.meta.requiresAuth && !userStore.isAuth) {
        return next('/login')
    }

    if (to.meta.role && userStore.user.role !== to.meta.role) {
        return next(userStore.user.role === 'teacher' ? '/teacher' : '/student')
    }

    next()
})

export default router
