import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConflictingFile } from './types';

export class PromptUtils {
  /**
   * Prompt user to confirm an action
   */
  static async confirmAction(message: string, defaultValue: boolean = false): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue,
      },
    ]);
    
    return confirmed;
  }

  /**
   * Prompt user to select from multiple choices
   */
  static async selectChoice(message: string, choices: string[]): Promise<string> {
    if (choices.length === 0) {
      throw new Error('No choices provided');
    }

    if (choices.length === 1) {
      return choices[0];
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices,
      },
    ]);

    return selected;
  }

  /**
   * Prompt user to select multiple choices
   */
  static async selectMultiple(message: string, choices: string[], defaultSelected: string[] = []): Promise<string[]> {
    if (choices.length === 0) {
      return [];
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message,
        choices,
        default: defaultSelected,
      },
    ]);

    return selected;
  }

  /**
   * Prompt user to input text
   */
  static async inputText(message: string, defaultValue?: string): Promise<string> {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message,
        default: defaultValue,
        validate: (input: string) => input.trim().length > 0 || 'Input cannot be empty',
      },
    ]);

    return input.trim();
  }

  /**
   * Handle file conflicts - ask user which files to overwrite
   */
  static async handleFileConflicts(conflicts: ConflictingFile[]): Promise<ConflictingFile[]> {
    if (conflicts.length === 0) {
      return [];
    }

    console.log(chalk.yellow('\n⚠️  File conflicts detected:\n'));

    // Show all conflicts
    for (const conflict of conflicts) {
      console.log(chalk.red(`  ✗ ${conflict.path}`));
    }

    console.log(''); // Empty line

    // Ask about each conflict individually
    const resolvedConflicts: ConflictingFile[] = [];

    for (const conflict of conflicts) {
      const action = await this.selectChoice(
        `What should we do with ${chalk.blue(conflict.path)}?`,
        ['Overwrite', 'Skip']
      );

      resolvedConflicts.push({
        ...conflict,
        action: action.toLowerCase() as 'overwrite' | 'skip'
      });
    }

    // Show summary
    console.log('\n' + chalk.blue('📋 Summary:'));
    const toOverwrite = resolvedConflicts.filter(c => c.action === 'overwrite');
    const toSkip = resolvedConflicts.filter(c => c.action === 'skip');

    if (toOverwrite.length > 0) {
      console.log(chalk.green(`  ✓ Will overwrite ${toOverwrite.length} file(s):`));
      for (const file of toOverwrite) {
        console.log(chalk.gray(`    - ${file.path}`));
      }
    }

    if (toSkip.length > 0) {
      console.log(chalk.yellow(`  ⚠ Will skip ${toSkip.length} file(s):`));
      for (const file of toSkip) {
        console.log(chalk.gray(`    - ${file.path}`));
      }
    }

    // Final confirmation
    const proceed = await this.confirmAction('\nContinue with installation?', false);
    
    if (!proceed) {
      throw new Error('Installation cancelled by user');
    }

    return resolvedConflicts;
  }

  /**
   * Show a success message with details
   */
  static showSuccess(message: string, details?: string[]): void {
    console.log(chalk.green(`\n✓ ${message}`));
    
    if (details && details.length > 0) {
      for (const detail of details) {
        console.log(chalk.gray(`  ${detail}`));
      }
    }
    
    console.log(''); // Empty line
  }

  /**
   * Show an error message
   */
  static showError(message: string): void {
    console.log(chalk.red(`\n✗ ${message}\n`));
  }

  /**
   * Show a warning message
   */
  static showWarning(message: string): void {
    console.log(chalk.yellow(`\n⚠️  ${message}\n`));
  }

  /**
   * Show an info message
   */
  static showInfo(message: string): void {
    console.log(chalk.blue(`\nℹ️  ${message}\n`));
  }

  /**
   * Show a spinner with message (using ora)
   */
  static showSpinner(message: string): any {
    const ora = require('ora');
    return ora(message).start();
  }
}