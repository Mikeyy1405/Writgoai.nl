/**
 * VPS Terminal Executor
 * Simpele SSH client voor direct command execution op Ubuntu VPS
 */

import { Client } from 'ssh2';
import { readFileSync } from 'fs';

export interface VPSConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: Buffer;
  passphrase?: string;
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

/**
 * Laad VPS configuratie van environment variabelen
 */
export function getVPSConfig(): VPSConfig {
  const host = process.env.VPS_HOST;
  const port = parseInt(process.env.VPS_PORT || '22');
  const username = process.env.VPS_USER;
  const password = process.env.VPS_PASSWORD;
  const keyPath = process.env.VPS_SSH_KEY_PATH;
  const passphrase = process.env.VPS_SSH_PASSPHRASE;

  if (!host || !username) {
    throw new Error('VPS_HOST en VPS_USER moeten geconfigureerd zijn in .env');
  }

  const config: VPSConfig = {
    host,
    port,
    username,
  };

  // Gebruik SSH key als beschikbaar, anders password
  if (keyPath) {
    try {
      config.privateKey = readFileSync(keyPath);
      if (passphrase) {
        config.passphrase = passphrase;
      }
    } catch (error) {
      throw new Error(`Kon SSH key niet lezen: ${keyPath}`);
    }
  } else if (password) {
    config.password = password;
  } else {
    throw new Error('VPS_PASSWORD of VPS_SSH_KEY_PATH moet geconfigureerd zijn');
  }

  return config;
}

/**
 * Voer een command uit op de VPS via SSH
 */
export async function executeCommand(
  command: string,
  config?: VPSConfig
): Promise<CommandResult> {
  const vpsConfig = config || getVPSConfig();

  return new Promise((resolve) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';
    let exitCode: number | null = null;

    // Timeout na 5 minuten
    const timeout = setTimeout(() => {
      conn.end();
      resolve({
        success: false,
        stdout,
        stderr,
        exitCode: null,
        error: 'Command timeout (5 minuten)',
      });
    }, 5 * 60 * 1000);

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeout);
          conn.end();
          resolve({
            success: false,
            stdout: '',
            stderr: '',
            exitCode: null,
            error: err.message,
          });
          return;
        }

        stream
          .on('close', (code: number) => {
            exitCode = code;
            clearTimeout(timeout);
            conn.end();
            resolve({
              success: code === 0,
              stdout,
              stderr,
              exitCode: code,
            });
          })
          .on('data', (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        stdout: '',
        stderr: '',
        exitCode: null,
        error: `SSH connectie fout: ${err.message}`,
      });
    });

    // Start SSH connectie
    conn.connect({
      host: vpsConfig.host,
      port: vpsConfig.port,
      username: vpsConfig.username,
      password: vpsConfig.password,
      privateKey: vpsConfig.privateKey,
      passphrase: vpsConfig.passphrase,
      readyTimeout: 30000, // 30 seconden voor connectie
    });
  });
}

/**
 * Voer meerdere commands uit (sequentieel)
 */
export async function executeCommands(
  commands: string[],
  config?: VPSConfig
): Promise<CommandResult[]> {
  const results: CommandResult[] = [];

  for (const command of commands) {
    const result = await executeCommand(command, config);
    results.push(result);

    // Stop bij eerste fout
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Test VPS connectie
 */
export async function testConnection(config?: VPSConfig): Promise<boolean> {
  try {
    const result = await executeCommand('echo "VPS connected"', config);
    return result.success && result.stdout.includes('VPS connected');
  } catch (error) {
    return false;
  }
}

/**
 * Installeer dependencies op VPS (Node.js, Docker, etc.)
 */
export async function setupVPS(): Promise<CommandResult[]> {
  const setupCommands = [
    // Update package list
    'sudo apt-get update',

    // Installeer basis tools
    'sudo apt-get install -y curl git wget build-essential',

    // Installeer Node.js (via nvm)
    'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash',
    'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"',
    'nvm install --lts',
    'nvm use --lts',

    // Installeer Docker
    'curl -fsSL https://get.docker.com -o get-docker.sh',
    'sudo sh get-docker.sh',
    'sudo usermod -aG docker $USER',

    // Installeer Docker Compose
    'sudo apt-get install -y docker-compose',

    // Verify installaties
    'node --version',
    'npm --version',
    'docker --version',
    'docker-compose --version',
  ];

  return executeCommands(setupCommands);
}
