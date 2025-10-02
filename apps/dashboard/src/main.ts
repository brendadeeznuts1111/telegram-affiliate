import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './style.css';

const app = createApp(App);

// Setup Pinia & Router
app.use(createPinia());
app.use(router);

// Initialize Telegram WebApp
try {
  // Check if Telegram WebApp is available
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Initialize
    tg.ready();
    
    // Expand to full screen
    tg.expand();
    
    // Enable closing confirmation
    tg.enableClosingConfirmation();
    
    // Apply Telegram theme colors to CSS variables
    const theme = tg.themeParams;
    
    if (theme.bg_color) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color);
      document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color || '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#999999');
      document.documentElement.style.setProperty('--tg-theme-link-color', theme.link_color || '#3390ec');
      document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color || '#3390ec');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color || '#f4f4f5');
      
      // Set dark mode class
      if (tg.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
    
    console.log('✅ Telegram WebApp initialized');
    console.log('Theme:', tg.colorScheme);
    console.log('User:', tg.initDataUnsafe?.user);
  } else {
    console.log('💡 Not running in Telegram (development mode)');
  }
} catch (error) {
  console.error('❌ Failed to initialize Telegram WebApp:', error);
  console.log('💡 Running in browser mode (for development)');
}

// Helper to detect dark color
function isDark(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

app.mount('#app');

