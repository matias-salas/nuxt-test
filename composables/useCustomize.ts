import type { Theme } from '@/lib/registry/themes'
import { themes } from '@/lib/registry/themes'

interface Config {
  theme?: Theme['name']
  radius: number
}

export function useCustomize() {
  const { value: color } = useColorMode()
  const isDark = color === 'dark'
  
  // Set fixed defaults instead of using cookie
  const config = reactive<Config>({
    theme: 'zinc',
    radius: 0.5,
  })

  const themeClass = computed(() => `theme-${config.theme}`)

  const theme = computed(() => config.theme)
  const radius = computed(() => config.radius)

  function setTheme(themeName: Theme['name']) {
    // This function is kept for API compatibility but does nothing
    // as we want to fix the theme to 'zinc'
    return
  }

  function setRadius(newRadius: number) {
    // This function is kept for API compatibility but does nothing
    // as we want to fix the radius to 0.5
    return
  }

  const themePrimary = computed(() => {
    const t = themes.find(t => t.name === theme.value)
    return `hsl(${
      t?.cssVars[isDark ? 'dark' : 'light'].primary
    })`
  })

  return {
    themeClass,
    theme,
    setTheme,
    radius,
    setRadius,
    themePrimary,
  }
}
