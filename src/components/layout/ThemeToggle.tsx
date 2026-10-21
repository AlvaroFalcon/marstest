import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useIntl } from 'react-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type ThemeToggleProps = {
  className?: string
}

/**
 * Two-state icon button that switches between the light and dark theme.
 * The accessible name describes the action (the theme it will switch to), and the icon shows
 * the theme currently applied. The system preference is only the initial value: once the user
 * clicks, an explicit choice is stored by next-themes.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const intl = useIntl()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn(className)}
      aria-label={intl.formatMessage({ id: isDark ? 'shell.theme.switchToLight' : 'shell.theme.switchToDark' })}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <MoonIcon aria-hidden="true" /> : <SunIcon aria-hidden="true" />}
    </Button>
  )
}
