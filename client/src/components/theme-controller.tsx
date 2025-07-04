import { useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Eye, EyeOff } from 'lucide-react';

export function ThemeController() {
  const { currentTheme, setTheme, useDefaultTheme, useDarkTheme, useBlueTheme, themes } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const handleThemeChange = (themeKey: string) => {
    switch (themeKey) {
      case 'default':
        useDefaultTheme();
        break;
      case 'dark':
        useDarkTheme();
        break;
      case 'blue':
        useBlueTheme();
        break;
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full p-3"
          variant="outline"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Controller
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Preset Themes</label>
            <Select onValueChange={handleThemeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Theme</SelectItem>
                <SelectItem value="dark">Dark Theme</SelectItem>
                <SelectItem value="blue">Blue Theme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Actions</label>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={useDefaultTheme}>
                Default
              </Button>
              <Button size="sm" variant="outline" onClick={useDarkTheme}>
                Dark
              </Button>
              <Button size="sm" variant="outline" onClick={useBlueTheme}>
                Blue
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="space-y-1">
              <div>Page BG: <span className="font-mono">{currentTheme.pageBackground}</span></div>
              <div>Borders: <span className="font-mono">{currentTheme.borderColor}</span></div>
              <div>Icons: <span className="font-mono">{currentTheme.iconBackground}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Development-only theme controller (shows only in development)
export function DevThemeController() {
  if (import.meta.env.PROD) {
    return null;
  }
  
  return <ThemeController />;
}