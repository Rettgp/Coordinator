import Vue from 'vue'
import vuetify from 'plugins/vuetify' // path to vuetify export
import axios from 'axios'

import App from '@/App'
import router from '@/router'
import store from '@/store'

import 'material-design-icons/iconfont/material-icons.css'

import './assets/css/main.css';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

new Vue({
  vuetify,
  components: { App },
  router,
  store,
  template: '<App/>',
}).$mount('#app')