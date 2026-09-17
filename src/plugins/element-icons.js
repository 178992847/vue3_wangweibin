/**
 * 全局注册 @element-plus/icons-vue 中的所有图标。
 *
 * 这样组件内无需再 import 图标，直接在模板中使用即可：
 *   1) 作为组件标签：<el-icon><Setting /></el-icon>
 *   2) 作为动态组件：<component :is="'Setting'" />
 *
 * 注：el-button 的 :icon / el-input 的 :prefix-icon 等 prop 接收的是组件对象，
 * 全局注册后模板中没有对应变量，因此请统一改用插槽形式（见各组件用法）。
 */
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default {
  install(app) {
    for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(name, component)
    }
  },
}
