import fs from 'fs';
import path from 'path';

export interface FileCopyOptions {
  overwrite?: boolean;
  createDirs?: boolean;
  prefix?: string;
}

export class FileOperations {
  /**
   * Copy a file from source to destination
   */
  static copyFile(srcPath: string, destPath: string, options: FileCopyOptions = {}): void {
    const { overwrite = false, createDirs = true, prefix } = options;

    // Apply prefix to destination filename if specified
    let finalDestPath = destPath;
    if (prefix) {
      const dir = path.dirname(destPath);
      const ext = path.extname(destPath);
      const base = path.basename(destPath, ext);
      const prefixedBase = prefix + base;
      finalDestPath = path.join(dir, prefixedBase + ext);
    }

    // Check if destination exists and handle overwrite
    if (fs.existsSync(finalDestPath) && !overwrite) {
      throw new Error(`File already exists: ${finalDestPath}`);
    }

    // Create destination directory if needed
    if (createDirs) {
      const destDir = path.dirname(finalDestPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
    }

    // Copy the file
    try {
      fs.copyFileSync(srcPath, finalDestPath);
    } catch (error) {
      throw new Error(`Failed to copy file: ${(error as Error).message}`);
    }
  }

  /**
   * Copy a directory recursively
   */
  static copyDirectory(srcDir: string, destDir: string, options: FileCopyOptions = {}): void {
    const { createDirs = true } = options;

    if (!fs.existsSync(srcDir)) {
      throw new Error(`Source directory does not exist: ${srcDir}`);
    }

    if (createDirs && !fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath, options);
      } else {
        this.copyFile(srcPath, destPath, options);
      }
    }
  }

  /**
   * Check if a file exists
   */
  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  /**
   * Check if a directory exists
   */
  static directoryExists(dirPath: string): boolean {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  /**
   * Read file content as string
   */
  static readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file: ${(error as Error).message}`);
    }
  }

  /**
   * Write content to file
   */
  static writeFile(filePath: string, content: string, options: { createDirs?: boolean } = {}): void {
    const { createDirs = true } = options;

    if (createDirs) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    try {
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file: ${(error as Error).message}`);
    }
  }

  /**
   * Get a list of files in a directory (recursive)
   */
  static getFilesInDirectory(dirPath: string, recursive: boolean = true): string[] {
    if (!this.directoryExists(dirPath)) {
      return [];
    }

    const files: string[] = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isFile()) {
        files.push(fullPath);
      } else if (entry.isDirectory() && recursive) {
        files.push(...this.getFilesInDirectory(fullPath, recursive));
      }
    }

    return files;
  }

  /**
   * Get relative path from one directory to another
   */
  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Ensure a directory exists, create it if it doesn't
   */
  static ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Remove a file if it exists
   */
  static removeFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        throw new Error(`Failed to remove file: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Remove a directory recursively
   */
  static removeDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
      } catch (error) {
        throw new Error(`Failed to remove directory: ${(error as Error).message}`);
      }
    }
  }
}