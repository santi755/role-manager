import { createRouter, createWebHistory } from 'vue-router'
import RolesView from '@/views/RolesView.vue'
import PermissionsView from '@/views/PermissionsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/roles'
    },
    {
      path: '/roles',
      name: 'roles',
      component: RolesView
    },
    {
      path: '/permissions',
      name: 'permissions',
      component: PermissionsView
    }
  ],
})

export default router
