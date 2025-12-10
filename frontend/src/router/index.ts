import { createRouter, createWebHistory } from 'vue-router'
import RolesView from '@/views/RolesView.vue'
import PermissionsView from '@/views/PermissionsView.vue'
import UsersView from '@/views/UsersView.vue'
import UserPermissionsView from '@/views/UserPermissionsView.vue'

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
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView
    },
    {
      path: '/user-permissions',
      name: 'user-permissions',
      component: UserPermissionsView
    }
  ],
})

export default router
