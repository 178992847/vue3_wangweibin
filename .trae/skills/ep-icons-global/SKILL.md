---
name: ep-icons-global
description: Globally register @element-plus/icons-vue icons and replace per-component imports with global usage. Use when fixing gray unused icon imports or converting el-button icon and el-input prefix-icon to el-icon slots. Not for other icon libraries.
---

# EP Icons Global Registration

Standardize Element Plus icon usage in this repo by registering all `@element-plus/icons-vue` icons globally, so components never need to import icons individually. This eliminates "gray/unused import" warnings caused by icons referenced only in templates.

## Apply only when

- Icons are imported from `@element-plus/icons-vue` and only used in templates.
- The user wants a unified icon approach across components.
- New components need Element Plus icons and you want to avoid per-file imports.

Do **not** use this skill for Iconify (`ep:xxx` syntax), custom SVG icons, or other icon libraries — follow the repo's existing convention for those.

## Step 1 — Confirm the global registration plugin exists

Check for `src/plugins/element-icons.js`. It should register every icon:

```js
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default {
  install(app) {
    for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(name, component)
    }
  },
}
```

Then in `src/main.js`, register it **after** `app.use(ElementPlus)`:

```js
import ElementIcons from '@/plugins/element-icons'
// ...
app.use(ElementIcons)
```

If the plugin already exists, skip to Step 3.

## Step 2 — Create the plugin if missing

Create `src/plugins/element-icons.js` with the code above, then add `app.use(ElementIcons)` to `main.js` (after Element Plus).

## Step 3 — Clean up each component

Remove the `import { ... } from '@element-plus/icons-vue'` line, then convert icon references using the matching pattern below.

### Pattern A — `el-button` / `el-dropdown-item` `:icon` prop

The `icon` prop expects a component object, which is unavailable after removing the import. Use the default slot with `<el-icon>` instead.

```html
<!-- before -->
<el-button type="primary" :icon="Setting">管理标签页</el-button>

<!-- after -->
<el-button type="primary">
  <el-icon><Setting /></el-icon>管理标签页
</el-button>
```

### Pattern B — `el-input` `:prefix-icon` / `:suffix-icon` prop

Use the `#prefix` / `#suffix` slot.

```html
<!-- before -->
<el-input v-model="x" :prefix-icon="Lock" />

<!-- after -->
<el-input v-model="x">
  <template #prefix><el-icon><Lock /></el-icon></template>
</el-input>
```

### Pattern C — Component tag inside `<el-icon>`

These already work with global registration; just drop the import. Use PascalCase to match the registered component names.

```html
<!-- before (imported) -->
<el-icon><CaretBottom /></el-icon>

<!-- after (global, no import) -->
<el-icon><CaretBottom /></el-icon>
```

### Pattern D — Dynamic icon in data, rendered via `<component :is>`

Store the globally-registered component **name as a string**; `<component :is>` resolves it automatically.

```js
// before
import { HomeFilled } from '@element-plus/icons-vue'
const menuItems = [{ icon: HomeFilled }]

// after
const menuItems = [{ icon: 'HomeFilled' }]
```

```html
<!-- template unchanged -->
<el-icon><component :is="item.icon" /></el-icon>
```

## Step 4 — Validate

1. Search `src/` for `from '@element-plus/icons-vue'` — only `src/plugins/element-icons.js` should remain.
2. Run the build (`npm run build`) and confirm it succeeds.
3. Spot-check that icons render correctly (button icons, input prefixes, menu icons).

## Trade-off

Global registration bundles all Element Plus icons into the main chunk (larger bundle). For production apps sensitive to bundle size, register only the icons actually used instead of the full `*` import — keep the same four conversion patterns above.
