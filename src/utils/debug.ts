import chalk from 'chalk';

class DebugLogger {
  private enabled = false;

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  log(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(chalk.gray(`[DEBUG] ${message}`), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(chalk.blue(`[DEBUG] ${message}`), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(chalk.yellow(`[DEBUG] ${message}`), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(chalk.red(`[DEBUG] ${message}`), ...args);
    }
  }

  time(label: string): void {
    if (this.enabled) {
      console.time(chalk.gray(`[DEBUG] ${label}`));
    }
  }

  timeEnd(label: string): void {
    if (this.enabled) {
      console.timeEnd(chalk.gray(`[DEBUG] ${label}`));
    }
  }
}

export const debug = new DebugLogger();