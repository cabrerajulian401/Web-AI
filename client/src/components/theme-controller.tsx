import { useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Eye, EyeOff } from 'lucide-react';

export function ThemeController() {
  const { currentTheme, setTheme, useDefaultTheme, useDarkTheme, useBlueTheme, themes } = useTheme();

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

  return (
    <Card className="w-96 shadow-xl bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Theme Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-3 block">Choose a Theme</label>
          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant={currentTheme === themes.default ? "default" : "outline"}
              onClick={useDefaultTheme}
              className="justify-start h-auto p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-gray-300"></div>
                <div>
                  <div className="font-medium">Default Theme</div>
                  <div className="text-sm text-gray-500">Light and clean</div>
                </div>
              </div>
            </Button>
            <Button 
              variant={currentTheme === themes.dark ? "default" : "outline"}
              onClick={useDarkTheme}
              className="justify-start h-auto p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-800 rounded-full border-2 border-gray-600"></div>
                <div>
                  <div className="font-medium">Dark Theme</div>
                  <div className="text-sm text-gray-500">Dark and modern</div>
                </div>
              </div>
            </Button>
            <Button 
              variant={currentTheme === themes.blue ? "default" : "outline"}
              onClick={useBlueTheme}
              className="justify-start h-auto p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-blue-300"></div>
                <div>
                  <div className="font-medium">Blue Theme</div>
                  <div className="text-sm text-gray-500">Professional blue</div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-400 pt-3 border-t">
          <div className="space-y-1">
            <div><strong>Current Settings:</strong></div>
            <div>Page: <span className="font-mono text-gray-600">{currentTheme.pageBackground}</span></div>
            <div>Borders: <span className="font-mono text-gray-600">{currentTheme.borderColor}</span></div>
            <div>Icons: <span className="font-mono text-gray-600">{currentTheme.iconBackground}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Development-only theme controller (shows only in development)
export function DevThemeController() {
  if (import.meta.env.PROD) {
    return null;
  }
  
  return <ThemeController />;
}