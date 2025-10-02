/**
 * Safe Path Validation using import.meta.resolve
 * Prevents path traversal attacks following Cursor rules
 */

/**
 * Validate and resolve a file path safely
 * Uses import.meta.resolve to prevent directory traversal attacks
 */
export function validatePath(
  filePath: string,
  baseDir?: string
): { safe: boolean; resolvedPath: string; error?: string } {
  try {
    // Check for obvious traversal attempts
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return {
        safe: false,
        resolvedPath: '',
        error: 'Path traversal detected: ".." or absolute paths not allowed',
      };
    }

    // Check for null bytes (common in path traversal attacks)
    if (filePath.includes('\0')) {
      return {
        safe: false,
        resolvedPath: '',
        error: 'Null byte detected in path',
      };
    }

    // Resolve the path
    const base = baseDir || process.cwd();
    const resolvedPath = import.meta.resolve(filePath, base);

    // Verify the resolved path is within the base directory
    if (!resolvedPath.startsWith(base)) {
      return {
        safe: false,
        resolvedPath,
        error: 'Resolved path is outside base directory',
      };
    }

    return {
      safe: true,
      resolvedPath,
    };
  } catch (error) {
    return {
      safe: false,
      resolvedPath: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Safely resolve a file path relative to project root
 */
export function resolveProjectPath(relativePath: string): string | null {
  const projectRoot = process.cwd();
  const validation = validatePath(relativePath, projectRoot);

  if (!validation.safe) {
    console.error(`❌ Path validation failed: ${validation.error}`);
    return null;
  }

  return validation.resolvedPath;
}

/**
 * Safely resolve a data file path
 */
export function resolveDataPath(filename: string): string | null {
  const dataDir = `${process.cwd()}/data`;
  const validation = validatePath(filename, dataDir);

  if (!validation.safe) {
    console.error(`❌ Data path validation failed: ${validation.error}`);
    return null;
  }

  return validation.resolvedPath;
}

/**
 * Validate upload file path
 */
export function validateUploadPath(
  filename: string,
  uploadDir: string = 'uploads'
): { safe: boolean; path?: string; error?: string } {
  // Additional validation for file uploads
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return {
      safe: false,
      error: `File extension ${extension} not allowed`,
    };
  }

  // Remove any path components from filename
  const sanitizedFilename = filename.split('/').pop()?.split('\\').pop();

  if (!sanitizedFilename) {
    return {
      safe: false,
      error: 'Invalid filename',
    };
  }

  const uploadPath = `${process.cwd()}/${uploadDir}`;
  const validation = validatePath(sanitizedFilename, uploadPath);

  if (!validation.safe) {
    return {
      safe: false,
      error: validation.error,
    };
  }

  return {
    safe: true,
    path: validation.resolvedPath,
  };
}

/**
 * Check if a file exists safely
 */
export async function safeFileExists(filePath: string): Promise<boolean> {
  const validation = validatePath(filePath);

  if (!validation.safe) {
    return false;
  }

  try {
    const file = Bun.file(validation.resolvedPath);
    return await file.exists();
  } catch {
    return false;
  }
}

/**
 * Safely read a file with path validation
 */
export async function safeReadFile(filePath: string): Promise<string | null> {
  const validation = validatePath(filePath);

  if (!validation.safe) {
    console.error(`❌ Cannot read file: ${validation.error}`);
    return null;
  }

  try {
    const file = Bun.file(validation.resolvedPath);
    return await file.text();
  } catch (error) {
    console.error(`❌ Error reading file:`, error);
    return null;
  }
}

/**
 * Safely write a file with path validation
 */
export async function safeWriteFile(
  filePath: string,
  content: string | Buffer
): Promise<boolean> {
  const validation = validatePath(filePath);

  if (!validation.safe) {
    console.error(`❌ Cannot write file: ${validation.error}`);
    return false;
  }

  try {
    await Bun.write(validation.resolvedPath, content);
    return true;
  } catch (error) {
    console.error(`❌ Error writing file:`, error);
    return false;
  }
}

