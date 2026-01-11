#!/usr/bin/env node

import { startInteractive } from './interactive';
import { initConfig } from './config/config';
import { initCommand } from './commands/init';

async function main() {
  // Check for "rlc init" command line argument
  const args = process.argv.slice(2);
  
  if (args[0] === 'init') {
    await initCommand();
    return;
  }
  
  let config = await initConfig();
  
  if (!config) {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║     ROGUELIKE CLI NOT INITIALIZED     ║');
    console.log('╚═══════════════════════════════════════╝\n');
    console.log('Running init wizard...\n');
    
    await initCommand();
    config = await initConfig();
    
    if (!config) {
      console.log('Initialization failed. Please try again.');
      process.exit(1);
    }
  }
  
  await startInteractive(config);
}

main().catch(console.error);

