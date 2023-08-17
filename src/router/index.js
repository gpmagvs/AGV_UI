import {
  createRouter,
  createWebHistory
} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HomeViewVersion2 from '../views/Version2/HomeView.vue'
import Admin from '../views/Admin.vue'
import MainStatuShow from '@/components/Version2/MainStatuShow.vue'
import { UIStore } from '@/store'
import AgvOverview from '@/components/AGVStatusOverview.vue';


const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/v2',
    name: '',
    component: HomeViewVersion2,
    children: [
      {

        path: '/v2',
        name: 'MainStatuShow',
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
    path: '/rd_test',
    name: 'rd_test',
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/RDTestView.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: Admin,
    children: [
      {
        path: 'controller',
        name: 'controller',
        component: () => import('../components/Admin/Controller.vue')
      }
    ]
  },
  {
    path: '/idle',
    name: 'idle',
    component: () => import('../views/IdleView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
