import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { showStartupAnimation } from './startup';
import { processCommand } from './commands';
import { Config, initConfig } from '../config/config';

function getCompletions(currentPath: string): string[] {
  if (!fs.existsSync(currentPath)) {
    return [];
  }
  
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  const completions: string[] = [];
  
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    
    completions.push(entry.name);
  }
  
  return completions;
}

export async function startInteractive(initialConfig: Config): Promise<void> {
  await showStartupAnimation();
  
  let config = initialConfig;
  
  // Use object to hold currentPath so closures always get the current value
  const state = {
    currentPath: config.currentPath
  };
  
  // Completer function that uses state.currentPath
  const completer = (line: string): [string[], string] => {
    try {
      const trimmed = line.trim();
      if (!trimmed) {
        return [[], ''];
      }
      
      // Find the last word using regex to get exact position
      const lastWordMatch = line.match(/(\S+)$/);
      if (!lastWordMatch) {
        return [[], line];
      }
      
      const lastWord = lastWordMatch[1];
      const lastWordStart = lastWordMatch.index!;
      const prefix = line.substring(lastWordStart);
      
      const parts = trimmed.split(/\s+/);
      const command = parts[0]?.toLowerCase() || '';
      
      // Only autocomplete if we're in a command that takes a path argument
      const commandsThatNeedCompletion = ['cd', 'open', 'cp', 'rm', 'mkdir'];
      
      if (commandsThatNeedCompletion.includes(command) && parts.length > 1) {
        const completions = getCompletions(state.currentPath);
        const hits = completions.filter((c) => c.toLowerCase().startsWith(lastWord.toLowerCase()));
        
        return [hits.length > 0 ? hits : [], prefix];
      }
      
      // If we're typing a command name itself
      if (parts.length === 1) {
        const commandCompletions = ['ls', 'cd', 'mkdir', 'open', 'cp', 'rm', 'tree', 'pwd', 'init', 'config', 'help', 'save', 'cancel', 'clean', 'exit', 'quit', '..', '...'];
        const hits = commandCompletions.filter((c) => c.toLowerCase().startsWith(lastWord.toLowerCase()));
        return [hits.length > 0 ? hits : commandCompletions, prefix];
      }
      
      return [[], line];
    } catch (e) {
      // Return empty completion on any error to prevent crash
      return [[], line];
    }
  };
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    completer: completer,
  });
  
  let isProcessingCommand = false;
  let currentCommandAbortController: AbortController | null = null;
  
  // Override SIGINT to cancel commands instead of exiting
  process.on('SIGINT', () => {
    if (isProcessingCommand) {
      // Cancel current command but stay in program
      if (currentCommandAbortController) {
        currentCommandAbortController.abort();
        currentCommandAbortController = null;
      }
      isProcessingCommand = false;
      console.log('\n^C');
      rl.prompt();
    } else {
      // Clear the line if not processing
      rl.write('\x1B[2K\r> ');
    }
  });
  
  rl.on('line', async (input: string) => {
    const trimmed = input.trim();
    
    if (trimmed === 'exit' || trimmed === 'quit') {
      rl.close();
      return;
    }
    
    if (trimmed === '') {
      rl.prompt();
      return;
    }
    
    // Create abort controller for this command
    currentCommandAbortController = new AbortController();
    isProcessingCommand = true;
    
    const abortController = currentCommandAbortController;
    
    try {
      const result = await processCommand(trimmed, state.currentPath, config, abortController.signal, rl);
      
      if (abortController.signal.aborted) {
        rl.prompt();
        return;
      }
      
      if (result.reloadConfig) {
        const newConfig = await initConfig();
        if (newConfig) {
          config = newConfig;
          state.currentPath = config.currentPath;
        }
      }
      
      if (result.newPath) {
        state.currentPath = result.newPath;
      }
      
      if (result.output) {
        console.log(result.output);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        console.log('\nCommand cancelled.');
      } else {
        console.error(`Error: ${error.message}`);
      }
    } finally {
      isProcessingCommand = false;
      currentCommandAbortController = null;
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    console.log('\nGoodbye!');
    process.exit(0);
  });
  
  rl.prompt();
}


