// ============================================================
// v-permission 按钮级权限指令
// 用法: v-permission="'product:write'" 或 v-permission="['product:write','order:list']"
// 无权限则移除该元素
// ============================================================
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/store/modules/user'

function checkPermission(value: string | string[]): boolean {
  const userStore = useUserStore()
  if (!value) return true
  if (Array.isArray(value)) {
    return value.some((v) => userStore.hasPermission(v))
  }
  return userStore.hasPermission(value)
}

export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    if (!checkPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  }
}