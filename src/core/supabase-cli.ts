import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class SupabaseCLI {
  /**
   * Check if Supabase CLI is installed and available
   */
  async checkCLIAvailable(): Promise<boolean> {
    try {
      await execAsync('supabase --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the version of the installed Supabase CLI
   */
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('supabase --version');
      // Extract version from output like "supabase version 1.xx.x"
      const match = stdout.trim().match(/supabase version (\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Initialize a new Supabase project in the specified directory
   */
  async initProject(projectPath: string): Promise<void> {
    const supabasePath = path.join(projectPath, 'supabase');
    
    // Check if supabase directory already exists
    if (fs.existsSync(supabasePath)) {
      throw new Error(`Supabase project already exists at: ${supabasePath}`);
    }

    try {
      await execAsync('supabase init', { cwd: projectPath });
    } catch (error) {
      throw new Error(`Failed to initialize Supabase project: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new migration with the given name
   */
  async createMigration(name: string, projectPath: string): Promise<string> {
    if (!this.isSupabaseProject(projectPath)) {
      throw new Error('Not a Supabase project. Run "supabase init" first.');
    }

    try {
      const { stdout } = await execAsync(`supabase migration new "${name}"`, { 
        cwd: projectPath 
      });
      
      // Extract the migration filename from the output
      // Output typically includes something like "Created new migration at supabase/migrations/20240907120001_name.sql"
      const match = stdout.match(/supabase\/migrations\/(\d+_.*\.sql)/);
      if (!match) {
        throw new Error('Could not extract migration filename from CLI output');
      }
      
      return match[1]; // Return just the filename
    } catch (error) {
      throw new Error(`Failed to create migration: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new edge function with the given name
   */
  async createFunction(name: string, projectPath: string): Promise<string> {
    if (!this.isSupabaseProject(projectPath)) {
      throw new Error('Not a Supabase project. Run "supabase init" first.');
    }

    try {
      await execAsync(`supabase functions new "${name}"`, { 
        cwd: projectPath 
      });
      
      return name;
    } catch (error) {
      throw new Error(`Failed to create function: ${(error as Error).message}`);
    }
  }

  /**
   * Check if the given directory is a Supabase project
   */
  isSupabaseProject(projectPath: string): boolean {
    const supabasePath = path.join(projectPath, 'supabase');
    const configPath = path.join(supabasePath, 'config.toml');
    
    return fs.existsSync(supabasePath) && 
           fs.statSync(supabasePath).isDirectory() &&
           fs.existsSync(configPath);
  }

  /**
   * Validate that the current project has a proper Supabase setup
   */
  validateProject(projectPath: string): void {
    const supabasePath = path.join(projectPath, 'supabase');
    
    if (!fs.existsSync(supabasePath)) {
      throw new Error('No supabase/ directory found. Run "supabase init" first.');
    }
    
    if (!fs.statSync(supabasePath).isDirectory()) {
      throw new Error('supabase/ exists but is not a directory.');
    }

    const configPath = path.join(supabasePath, 'config.toml');
    if (!fs.existsSync(configPath)) {
      throw new Error('supabase/config.toml not found. This may not be a valid Supabase project.');
    }

    // Check for required directories
    const requiredDirs = ['migrations', 'functions'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(supabasePath, dir);
      if (!fs.existsSync(dirPath)) {
        console.warn(chalk.yellow(`Warning: ${dir} directory not found at ${dirPath}`));
      }
    }
  }

  /**
   * Get the path to the Supabase directory for a project
   */
  getSupabasePath(projectPath: string): string {
    return path.join(projectPath, 'supabase');
  }

  /**
   * Get the path to migrations directory
   */
  getMigrationsPath(projectPath: string): string {
    return path.join(this.getSupabasePath(projectPath), 'migrations');
  }

  /**
   * Get the path to functions directory
   */
  getFunctionsPath(projectPath: string): string {
    return path.join(this.getSupabasePath(projectPath), 'functions');
  }

  /**
   * Get the path to a specific function
   */
  getFunctionPath(functionName: string, projectPath: string): string {
    return path.join(this.getFunctionsPath(projectPath), functionName);
  }

  /**
   * Show helpful error message when CLI is not available
   */
  static showInstallInstructions(): void {
    console.log(chalk.red('✗ Supabase CLI not found\n'));
    console.log('SupaBootstrap requires the Supabase CLI to be installed.\n');
    console.log('Install it with:');
    console.log(chalk.cyan('  npm install -g supabase'));
    console.log(chalk.gray('  # or'));
    console.log(chalk.cyan('  brew install supabase/tap/supabase'));
    console.log('\nThen run this command again.');
  }
}

export const supabaseCLI = new SupabaseCLI();