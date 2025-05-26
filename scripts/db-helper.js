#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const commands = {
  '1': {
    name: 'Push migrations',
    command: 'npx supabase db push',
    description: 'Apply all pending migrations to the database'
  },
  '2': {
    name: 'Seed database',
    command: 'npx supabase db seed',
    description: 'Populate the database with sample data'
  },
  '3': {
    name: 'Reset database',
    command: 'npx supabase db reset',
    description: 'Reset the database to a clean state (WARNING: Deletes all data!)'
  },
  '4': {
    name: 'Create new migration',
    command: async () => {
      const name = await question('Migration name (e.g., add_user_preferences): ');
      if (name) {
        return `npx supabase migration new ${name}`;
      }
      return null;
    },
    description: 'Create a new migration file'
  },
  '5': {
    name: 'View migration status',
    command: 'npx supabase migration list',
    description: 'List all migrations and their status'
  },
  '6': {
    name: 'Start local Supabase',
    command: 'npx supabase start',
    description: 'Start local Supabase instance for development'
  },
  '7': {
    name: 'Stop local Supabase',
    command: 'npx supabase stop',
    description: 'Stop local Supabase instance'
  }
};

console.log('🗄️  Database Helper\n');
console.log('Select an operation:\n');

Object.entries(commands).forEach(([key, cmd]) => {
  console.log(`${key}. ${cmd.name}`);
  console.log(`   ${cmd.description}\n`);
});

console.log('0. Exit\n');

async function main() {
  const choice = await question('Enter your choice (0-7): ');
  
  if (choice === '0') {
    console.log('Goodbye! 👋');
    rl.close();
    return;
  }
  
  const selectedCommand = commands[choice];
  
  if (!selectedCommand) {
    console.log('❌ Invalid choice. Please try again.');
    rl.close();
    return;
  }
  
  console.log(`\n🚀 Running: ${selectedCommand.name}...\n`);
  
  try {
    let command = selectedCommand.command;
    
    // Handle async commands
    if (typeof command === 'function') {
      command = await command();
      if (!command) {
        console.log('Operation cancelled.');
        rl.close();
        return;
      }
    }
    
    // Add confirmation for destructive operations
    if (choice === '3') {
      const confirm = await question('⚠️  This will DELETE ALL DATA. Are you sure? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes') {
        console.log('Operation cancelled.');
        rl.close();
        return;
      }
    }
    
    execSync(command, { stdio: 'inherit' });
    console.log('\n✅ Operation completed successfully!');
  } catch (error) {
    console.error('\n❌ Operation failed:', error.message);
  }
  
  rl.close();
}

main().catch(console.error);