import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'app',
      component: require('@/App').default
    },
    {
      path: '/home',
      name: 'home',
      component: require('@/components/Home').default
    },
    {
      path: '/Editor',
      name: 'editor',
      component: require('@/components/Editor').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
