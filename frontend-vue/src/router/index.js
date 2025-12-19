import { createWebHistory, createRouter } from 'vue-router'
import Home from '/src/views/Front.vue'
import Search from '/src/views/Search.vue'
import DownloadsView from '/src/views/DownloadsView.vue'
import About from '/src/views/About.vue'
import Changelog from '/src/views/Changelog.vue'
import Privacy from '/src/views/Privacy.vue'
import Terms from '/src/views/Terms.vue'
import Disclaimer from '/src/views/Disclaimer.vue'
import NotFound from '/src/views/NotFound.vue'
import config from '/src/config'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/search/:query',
    name: 'Search',
    component: Search,
  },
  {
    path: '/downloads',
    name: 'Downloads',
    component: DownloadsView,
  },
  {
    path: '/about',
    name: 'About',
    component: About,
  },
  {
    path: '/changelog',
    name: 'Changelog',
    component: Changelog,
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: Privacy,
  },
  {
    path: '/terms',
    name: 'Terms',
    component: Terms,
  },
  {
    path: '/disclaimer',
    name: 'Disclaimer',
    component: Disclaimer,
  },
  // Redirect old routes to new one
  {
    path: '/list',
    redirect: '/downloads'
  },
  {
    path: '/download',
    redirect: '/downloads'
  },
  // 404 catch-all
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(config.BASEURL),
  routes,
})

export default router
