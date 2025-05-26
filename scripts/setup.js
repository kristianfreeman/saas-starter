#!/usr/bin/env node

import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🚀 SaaS Starter Setup\n');

async function setup() {
  try {
    // Check if .env exists
    if (!existsSync('.env')) {
      console.log('📝 Creating .env file from .env.example...');
      copyFileSync('.env.example', '.env');
      console.log('✅ .env file created\n');
    } else {
      console.log('✅ .env file already exists\n');
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');

    // Check for required tools
    console.log('🔍 Checking required tools...\n');
    
    // Check Supabase CLI
    try {
      execSync('supabase --version', { stdio: 'ignore' });
      console.log('✅ Supabase CLI is installed');
    } catch {
      console.log('❌ Supabase CLI not found');
      console.log('   Install it with: npm install -g supabase');
    }

    // Check Stripe CLI
    try {
      execSync('stripe --version', { stdio: 'ignore' });
      console.log('✅ Stripe CLI is installed');
    } catch {
      console.log('❌ Stripe CLI not found');
      console.log('   Install it from: https://stripe.com/docs/stripe-cli');
    }

    console.log('\n📋 Next Steps:\n');
    console.log('1. Set up your environment variables:');
    console.log('   - Edit .env file with your actual values');
    console.log('   - Get Supabase credentials from https://supabase.com');
    console.log('   - Get Stripe keys from https://stripe.com');
    console.log('   - Get Resend API key from https://resend.com\n');
    
    console.log('2. Set up the database:');
    console.log('   - Run: npm run db:push');
    console.log('   - (Optional) Run: npm run db:seed\n');
    
    console.log('3. Start development:');
    console.log('   - Run: npm run dev');
    console.log('   - Open: http://localhost:4321\n');

    // Ask if user wants to open .env file
    const openEnv = await question('Would you like to open the .env file now? (y/n) ');
    if (openEnv.toLowerCase() === 'y') {
      console.log('Opening .env file...');
      try {
        // Try to open with default editor
        if (process.platform === 'darwin') {
          execSync('open .env');
        } else if (process.platform === 'win32') {
          execSync('start .env');
        } else {
          execSync('xdg-open .env');
        }
      } catch {
        console.log('Could not open .env file automatically. Please open it manually.');
      }
    }

    console.log('\n✨ Setup complete! Happy coding! 🎉\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setup();