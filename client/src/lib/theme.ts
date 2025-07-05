export interface ThemeConfig {
  // Page backgrounds
  pageBackground: string;
  
  // Dividers
  dividerColor: string;
  dividerWidth: string;
  
  // Icon backgrounds
  iconBackground: string;
  
  // Borders
  borderColor: string;
  borderWidth: string;
  borderFocusColor: string;
  
  // Report cards (expandable sections)
  reportCardBackground: string;
  reportCardBorder: string;
  
  // Article cards
  articleCardBackground: string;
  articleCardBorder: string;
  articleCardHoverBackground: string;
  
  // Sidebar
  sidebarTextColor: string;
  sidebarBackground: string;
  sidebarBorderColor: string;
  
  // Text colors
  headerTextColor: string;
  headlineTextColor: string;
  researchCardHeaderTextColor: string;
  bodyTextColor: string;
  mutedTextColor: string;
  researchPromptTextColor: string;
}

// Default theme (current colors)
export const defaultTheme: ThemeConfig = {
  // Page backgrounds
  pageBackground: 'rgb(249, 250, 251)', // gray-50
  
  // Dividers
  dividerColor: 'rgb(0, 0, 0)', // black
  dividerWidth: '2px',
  
  // Icon backgrounds
  iconBackground: 'rgb(0, 0, 0)', // black
  
  // Borders
  borderColor: 'rgb(209, 213, 219)', // gray-300
  borderWidth: '2px',
  borderFocusColor: 'rgb(59, 130, 246)', // blue-500
  
  // Report cards
  reportCardBackground: 'rgb(255, 255, 255)', // white
  reportCardBorder: 'rgb(209, 213, 219)', // gray-200
  
  // Article cards
  articleCardBackground: 'rgb(255, 255, 255)', // white
  articleCardBorder: 'rgb(209, 213, 219)', // gray-200
  articleCardHoverBackground: 'rgb(249, 250, 251)', // gray-50
  
  // Sidebar
  sidebarTextColor: 'rgb(75, 85, 99)', // gray-600
  sidebarBackground: 'rgb(255, 255, 255)', // white
  sidebarBorderColor: 'rgb(209, 213, 219)', // gray-300
  
  // Text colors
  headerTextColor: 'rgb(17, 24, 39)', // gray-900
  headlineTextColor: 'rgb(17, 24, 39)', // gray-900
  researchCardHeaderTextColor: 'rgb(55, 65, 81)', // gray-700
  bodyTextColor: 'rgb(75, 85, 99)', // gray-600
  mutedTextColor: 'rgb(156, 163, 175)', // gray-400
  researchPromptTextColor: 'rgb(17, 24, 39)', // gray-900
};

// Alternative theme examples
export const darkTheme: ThemeConfig = {
  pageBackground: 'rgb(17, 24, 39)', // gray-900
  dividerColor: 'rgb(255, 255, 255)', // white
  dividerWidth: '2px',
  iconBackground: 'rgb(255, 255, 255)', // white
  borderColor: 'rgb(75, 85, 99)', // gray-600
  borderWidth: '2px',
  borderFocusColor: 'rgb(59, 130, 246)', // blue-500
  reportCardBackground: 'rgb(31, 41, 55)', // gray-800
  reportCardBorder: 'rgb(75, 85, 99)', // gray-600
  articleCardBackground: 'rgb(31, 41, 55)', // gray-800
  articleCardBorder: 'rgb(75, 85, 99)', // gray-600
  articleCardHoverBackground: 'rgb(55, 65, 81)', // gray-700
  sidebarTextColor: 'rgb(209, 213, 219)', // gray-300
  sidebarBackground: 'rgb(31, 41, 55)', // gray-800
  sidebarBorderColor: 'rgb(75, 85, 99)', // gray-600
  headerTextColor: 'rgb(255, 255, 255)', // white
  headlineTextColor: 'rgb(255, 255, 255)', // white
  researchCardHeaderTextColor: 'rgb(209, 213, 219)', // gray-300
  bodyTextColor: 'rgb(156, 163, 175)', // gray-400
  mutedTextColor: 'rgb(107, 114, 128)', // gray-500
  researchPromptTextColor: 'rgb(255, 255, 255)', // white
};

export const blueTheme: ThemeConfig = {
  pageBackground: 'rgb(239, 246, 255)', // blue-50
  dividerColor: 'rgb(37, 99, 235)', // blue-600
  dividerWidth: '2px',
  iconBackground: 'rgb(37, 99, 235)', // blue-600
  borderColor: 'rgb(147, 197, 253)', // blue-300
  borderWidth: '2px',
  borderFocusColor: 'rgb(59, 130, 246)', // blue-500
  reportCardBackground: 'rgb(255, 255, 255)', // white
  reportCardBorder: 'rgb(147, 197, 253)', // blue-300
  articleCardBackground: 'rgb(255, 255, 255)', // white
  articleCardBorder: 'rgb(147, 197, 253)', // blue-300
  articleCardHoverBackground: 'rgb(219, 234, 254)', // blue-100
  sidebarTextColor: 'rgb(30, 64, 175)', // blue-800
  sidebarBackground: 'rgb(255, 255, 255)', // white
  sidebarBorderColor: 'rgb(147, 197, 253)', // blue-300
  headerTextColor: 'rgb(30, 58, 138)', // blue-900
  headlineTextColor: 'rgb(30, 58, 138)', // blue-900
  researchCardHeaderTextColor: 'rgb(37, 99, 235)', // blue-600
  bodyTextColor: 'rgb(30, 64, 175)', // blue-800
  mutedTextColor: 'rgb(96, 165, 250)', // blue-400
  researchPromptTextColor: 'rgb(30, 58, 138)', // blue-900
};

// Theme management
export class ThemeManager {
  private static currentTheme: ThemeConfig = defaultTheme;
  
  static setTheme(theme: ThemeConfig) {
    this.currentTheme = theme;
    this.applyTheme();
  }
  
  static getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }
  
  private static applyTheme() {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--page-bg', this.currentTheme.pageBackground);
    root.style.setProperty('--divider-color', this.currentTheme.dividerColor);
    root.style.setProperty('--divider-width', this.currentTheme.dividerWidth);
    root.style.setProperty('--icon-bg', this.currentTheme.iconBackground);
    root.style.setProperty('--border-color', this.currentTheme.borderColor);
    root.style.setProperty('--border-width', this.currentTheme.borderWidth);
    root.style.setProperty('--border-focus-color', this.currentTheme.borderFocusColor);
    root.style.setProperty('--report-card-bg', this.currentTheme.reportCardBackground);
    root.style.setProperty('--report-card-border', this.currentTheme.reportCardBorder);
    root.style.setProperty('--article-card-bg', this.currentTheme.articleCardBackground);
    root.style.setProperty('--article-card-border', this.currentTheme.articleCardBorder);
    root.style.setProperty('--article-card-hover-bg', this.currentTheme.articleCardHoverBackground);
    root.style.setProperty('--sidebar-text-color', this.currentTheme.sidebarTextColor);
    root.style.setProperty('--sidebar-bg', this.currentTheme.sidebarBackground);
    root.style.setProperty('--sidebar-border-color', this.currentTheme.sidebarBorderColor);
    root.style.setProperty('--header-text-color', this.currentTheme.headerTextColor);
    root.style.setProperty('--headline-text-color', this.currentTheme.headlineTextColor);
    root.style.setProperty('--research-card-header-text-color', this.currentTheme.researchCardHeaderTextColor);
    root.style.setProperty('--body-text-color', this.currentTheme.bodyTextColor);
    root.style.setProperty('--muted-text-color', this.currentTheme.mutedTextColor);
    root.style.setProperty('--research-prompt-text-color', this.currentTheme.researchPromptTextColor);
  }
  
  // Preset themes
  static useDefaultTheme() { this.setTheme(defaultTheme); }
  static useDarkTheme() { this.setTheme(darkTheme); }
  static useBlueTheme() { this.setTheme(blueTheme); }
}