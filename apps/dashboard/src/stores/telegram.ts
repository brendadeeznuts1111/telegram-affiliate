import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

export const useTelegramStore = defineStore('telegram', () => {
  const isInitialized = ref(false);
  const user = ref<any>(null);
  const theme = ref<'light' | 'dark'>('light');
  
  const isDark = computed(() => theme.value === 'dark');
  
  function initialize() {
    try {
      // Try to use Telegram WebApp directly first (more reliable)
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Get user data
        if (tg.initDataUnsafe?.user) {
          user.value = {
            id: tg.initDataUnsafe.user.id,
            firstName: tg.initDataUnsafe.user.first_name,
            lastName: tg.initDataUnsafe.user.last_name,
            username: tg.initDataUnsafe.user.username,
          };
        }
        
        // Get theme
        theme.value = tg.colorScheme === 'dark' ? 'dark' : 'light';
        
        isInitialized.value = true;
        console.log('✅ Telegram WebApp initialized:', { 
          user: user.value, 
          theme: theme.value,
        });
        return;
      }
      
      // Fallback to SDK (will fail in dev mode, which is fine)
      try {
        const launchParams = retrieveLaunchParams();
        if (launchParams.initData?.user) {
          user.value = launchParams.initData.user;
        }
        theme.value = 'light';
        isInitialized.value = true;
        console.log('✅ Telegram SDK initialized');
      } catch (sdkError) {
        // Expected in dev mode - just fall through to dev setup
        throw sdkError;
      }
    } catch (error) {
      // Running in browser (dev mode) - use mock data
      console.log('💡 Running in development mode (not in Telegram)');
      
      // Mock data for development
      user.value = {
        id: 8013171035,
        firstName: 'Billabong',
        username: 'billabongwanger',
      };
      theme.value = 'light';
      isInitialized.value = true;
    }
  }
  
  function isDarkColor(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }
  
  return {
    isInitialized,
    user,
    theme,
    isDark,
    initialize,
  };
});

