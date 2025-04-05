import {
  createRouter,
  createWebHistory
} from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import HomeViewV2 from '@/views/Version2/HomeView.vue'
import Admin from '@/views/Admin.vue'
import MainStatuShow from '@/components/Version2/MainStatuShow.vue'
import { UIStore } from '@/store'
import AgvOverview from '@/components/AGVStatusOverview.vue';
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    children: [
      {
        path: '',
        name: 'overview',
        component: AgvOverview
      },
      {
        path: 'io',
        name: 'io-table',
        component: () => import('@/components/Version2/DIOViewer.vue')
      },
      {
        path: 'alarm',
        name: 'alarm',
        component: () => import('@/components/AlarmWarningTable.vue')
      },
      {
        path: 'controller',
        name: 'controller',
        component: () => import('@/components/Admin/Controller.vue'),
        children: [
          {
            path: 'move',
            name: 'move-control',
            component: () => import('@/components/Controller/MoveController.vue')
          },
          {
            path: 'fork',
            name: 'fork-control',
            component: () => import('@/components/Controller/ForkController.vue')
          }
        ]
      }
    ]
  },
  {
    path: '/v2',
    name: 'home-v2',
    component: HomeViewV2,
    children: [
      {
        path: '',
        name: 'v2-overview',
        component: AgvOverview,
      },
      {
        path: 'IOTable',
        component: () => import('../components/Version2/DIOViewer.vue'),
      },
      {
        path: 'Alarm',
        component: () => import('../components/AlarmWarningTable.vue'),
      },
      {
        path: 'controller',
        component: () => import('../components/Admin/Controller.vue'),
        children: [
          {
            path: 'move',
            component: () => import('../components/Controller/MoveController.vue')
          },
          {
            path: 'fork',
            component: () => import('../components/Controller/ForkController.vue')
          }
        ]
      },
      {
        path: 'rd_test',
        component: () =>
          import(/* webpackChunkName: "about" */ '../views/RDTestView.vue'),
      },
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: Admin,
    children: [
      {
        path: 'controller',
        name: 'admin-controller',
        component: () => import('@/components/Admin/Controller.vue')
      }
    ]
  },
  {
    path: '/rd_test',
    name: 'rd-test',
    component: () => import('@/views/RDTestView.vue')
  },
  {
    path: '/idle',
    name: 'idle',
    component: () => import('@/views/IdleView.vue')
  },
  {
    path: '/playground',
    name: 'playground',
    component: () => import('@/views/Playground.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
