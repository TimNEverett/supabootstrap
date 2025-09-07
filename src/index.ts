#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { listCommand } from './commands/list';
import { installCommand } from './commands/install';
import { uninstallCommand } from './commands/uninstall';
import { doctorCommand } from './commands/doctor';

const program = new Command();

program
  .name('supabootstrap')
  .description('A CLI utility to install database features into Supabase projects')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize project and create config file')
  .action(initCommand);

program
  .command('list')
  .description('Show available features with descriptions')
  .action(listCommand);

program
  .command('install <feature>')
  .description('Install a feature with conflict resolution')
  .action(installCommand);

program
  .command('uninstall <feature>')
  .description('Remove a feature')
  .action(uninstallCommand);

program
  .command('doctor')
  .description('Check for modified feature files')
  .action(doctorCommand);

program.parse();