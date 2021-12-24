import Vue from 'vue'
import vuetify from 'plugins/vuetify' // path to vuetify export
import axios from 'axios'

import App from '@/App'
import router from '@/router'
import store from '@/store'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(fas)

import 'material-design-icons/iconfont/material-icons.css'

import './assets/css/main.css';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.component('font-awesome-icon', FontAwesomeIcon)

new Vue({
  vuetify,
  components: { App },
  router,
  store,
  template: '<App/>',
}).$mount('#app')