import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DraggableColorPicker } from '@/components/ui/draggable-color-picker';
import { Palette, RotateCcw, Move, X } from 'lucide-react';
import { ThemeConfig, defaultTheme } from '@/lib/theme';

interface ThemeControllerProps {
  onClose?: () => void;
}

export function ThemeController({ onClose }: ThemeControllerProps = {}) {
  const { currentTheme, setTheme } = useTheme();
  const [workingTheme, setWorkingTheme] = useState<ThemeConfig>(currentTheme);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleColorChange = (property: keyof ThemeConfig, value: string) => {
    const newTheme = { ...workingTheme, [property]: value };
    setWorkingTheme(newTheme);
    setTheme(newTheme);
  };

  const resetToDefault = () => {
    setWorkingTheme(defaultTheme);
    setTheme(defaultTheme);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragStart.y));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Center the modal initially
  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2
      });
    }
  }, []);

  const ColorInput = ({ 
    label, 
    property, 
    value 
  }: { 
    label: string; 
    property: keyof ThemeConfig; 
    value: string; 
  }) => (
    <DraggableColorPicker
      label={label}
      value={value}
      onChange={(color) => handleColorChange(property, color)}
    />
  );

  return (
    <Card 
      ref={cardRef}
      className="w-[600px] shadow-xl bg-white max-h-[600px] overflow-hidden select-none"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <CardHeader className="pb-3 drag-handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2 pointer-events-none">
            <Move className="h-5 w-5 text-gray-400" />
            <Palette className="h-6 w-6" />
            Custom Colors
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetToDefault}
            className="flex items-center gap-2 pointer-events-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="pointer-events-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <div className="max-h-[500px] overflow-y-auto">
        <CardContent className="space-y-4">
        


        {/* Color Settings in Grid Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Page & Layout</h3>
              <ColorInput 
                label="Page Background" 
                property="pageBackground" 
                value={workingTheme.pageBackground} 
              />
              <ColorInput 
                label="Divider Color" 
                property="dividerColor" 
                value={workingTheme.dividerColor} 
              />
              <ColorInput 
                label="Icon Background" 
                property="iconBackground" 
                value={workingTheme.iconBackground} 
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Cards</h3>
              <ColorInput 
                label="Report Card Background" 
                property="reportCardBackground" 
                value={workingTheme.reportCardBackground} 
              />
              <ColorInput 
                label="Report Card Border" 
                property="reportCardBorder" 
                value={workingTheme.reportCardBorder} 
              />
              <ColorInput 
                label="Article Card Background" 
                property="articleCardBackground" 
                value={workingTheme.articleCardBackground} 
              />
              <ColorInput 
                label="Article Card Border" 
                property="articleCardBorder" 
                value={workingTheme.articleCardBorder} 
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Borders</h3>
              <ColorInput 
                label="Border Color" 
                property="borderColor" 
                value={workingTheme.borderColor} 
              />
              <ColorInput 
                label="Focus Border" 
                property="borderFocusColor" 
                value={workingTheme.borderFocusColor} 
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Sidebar</h3>
              <ColorInput 
                label="Sidebar Background" 
                property="sidebarBackground" 
                value={workingTheme.sidebarBackground} 
              />
              <ColorInput 
                label="Sidebar Text" 
                property="sidebarTextColor" 
                value={workingTheme.sidebarTextColor} 
              />
              <ColorInput 
                label="Sidebar Border" 
                property="sidebarBorderColor" 
                value={workingTheme.sidebarBorderColor} 
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Text Colors</h3>
              <ColorInput 
                label="Header Text" 
                property="headerTextColor" 
                value={workingTheme.headerTextColor} 
              />
              <ColorInput 
                label="Headline Text" 
                property="headlineTextColor" 
                value={workingTheme.headlineTextColor} 
              />
              <ColorInput 
                label="Body Text" 
                property="bodyTextColor" 
                value={workingTheme.bodyTextColor} 
              />
              <ColorInput 
                label="Muted Text" 
                property="mutedTextColor" 
                value={workingTheme.mutedTextColor} 
              />
              <ColorInput 
                label="Research Prompt Text" 
                property="researchPromptTextColor" 
                value={workingTheme.researchPromptTextColor} 
              />
            </div>
          </div>
        </div>
        </CardContent>
      </div>
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