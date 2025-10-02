/**
 * Shared CLI Utilities
 * Standardized helpers for all CLI commands across the project
 */

// Signal handling for graceful shutdown
export function setupSignalHandlers(cleanup?: () => Promise<void> | void) {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      
      if (cleanup) {
        try {
          await cleanup();
        } catch (error) {
          console.error('❌ Cleanup error:', error);
        }
      }
      
      process.exit(0);
    });
  });
}

// Data formatting with Bun.inspect.table
export function formatTable(data: any[], properties?: string[], options?: any) {
  if (data.length === 0) {
    console.log('📊 No data to display');
    return;
  }
  
  // Use Bun's native table formatting
  console.log('\n📊 Data Table:');
  Bun.inspect.table(data, properties, options);
}

// Debug logging (controlled by --debug/-g flag)
let debugEnabled = false;

export function enableDebug() {
  debugEnabled = true;
}

export function isDebugEnabled() {
  return debugEnabled;
}

export function debug(...args: any[]) {
  if (debugEnabled) {
    console.log('🔍 [DEBUG]', ...args);
  }
}

// Parse CLI arguments
export interface CLIArgs {
  debug: boolean;
  [key: string]: any;
}

export function parseArgs(args: string[]): CLIArgs {
  const parsed: CLIArgs = { debug: false };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle --debug or -g flag
    if (arg === '--debug' || arg === '-g') {
      parsed.debug = true;
      enableDebug();
      continue;
    }
    
    // Handle --key=value
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      parsed[key] = value || true;
      continue;
    }
    
    // Handle -abc flags
    if (arg.startsWith('-') && arg.length > 2) {
      for (const char of arg.slice(1)) {
        if (char === 'g') {
          parsed.debug = true;
          enableDebug();
        } else {
          parsed[char] = true;
        }
      }
    }
  }
  
  return parsed;
}

// Spinner for long-running operations
export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private interval: Timer | null = null;
  private currentFrame = 0;
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  start() {
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.text}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  success(message?: string) {
    this.stop();
    console.log(`✅ ${message || this.text}`);
  }

  error(message?: string) {
    this.stop();
    console.log(`❌ ${message || this.text}`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r\x1b[K'); // Clear line
    }
  }
}

// Progress bar
export function showProgress(current: number, total: number, label: string = '') {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 2);
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  process.stdout.write(`\r${label} [${bar}] ${percentage}% (${current}/${total})`);
  
  if (current === total) {
    console.log(''); // New line when complete
  }
}

// Error formatting
export function formatError(error: Error | string, context?: string): string {
  const errorMsg = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;
  
  let output = `❌ Error${context ? ` in ${context}` : ''}: ${errorMsg}`;
  
  if (debugEnabled && stack) {
    output += `\n\n📚 Stack Trace:\n${stack}`;
  }
  
  return output;
}

// Success message formatting
export function success(message: string, emoji: string = '✅') {
  console.log(`${emoji} ${message}`);
}

// Warning message formatting
export function warning(message: string) {
  console.log(`⚠️  ${message}`);
}

// Info message formatting
export function info(message: string) {
  console.log(`ℹ️  ${message}`);
}

// Box around text
export function box(text: string, title?: string) {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(l => l.length), title?.length || 0);
  const border = '─'.repeat(maxLength + 4);
  
  console.log(`\n┌${border}┐`);
  if (title) {
    console.log(`│  ${title.padEnd(maxLength)}  │`);
    console.log(`├${border}┤`);
  }
  lines.forEach(line => {
    console.log(`│  ${line.padEnd(maxLength)}  │`);
  });
  console.log(`└${border}┘\n`);
}

