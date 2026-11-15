#!/usr/bin/env node

/**
 * CLI script to create an initial admin user.
 *
 * Usage:
 *   node src/scripts/createAdmin.js --email admin@jcc.edu.in --password SecurePass123! --name "Admin User"
 *
 * You can also set ADMIN_SETUP_SECRET in .env and pass --secret <value> for
 * one-time automated provisioning (e.g. in a Docker entrypoint).
 */

import 'dotenv/config';
import { parseArgs } from 'node:util';
import readline from 'node:readline/promises';
import argon2 from 'argon2';

import { sequelize } from '../config/sequelize.js';
import { User, AdminProfile } from '../models/index.js';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    email:    { type: 'string', short: 'e' },
    password: { type: 'string', short: 'p' },
    name:     { type: 'string', short: 'n' },
    secret:   { type: 'string', short: 's' },
    help:     { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
  allowPositionals: true,
});

if (args.help) {
  console.log(`
Usage:
  node src/scripts/createAdmin.js --email <email> --password <pass> --name "Full Name"

Options:
  -e, --email      Admin email (required)
  -p, --password   Admin password (required, min 8 chars)
  -n, --name       Admin full name (required)
  -s, --secret     ADMIN_SETUP_SECRET for automated provisioning
  -h, --help       Show this help
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Interactive prompt fallback
// ---------------------------------------------------------------------------

async function prompt(question, hidden = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Verify setup secret if provided
  if (args.secret) {
    const expected = process.env.ADMIN_SETUP_SECRET;
    if (!expected) {
      console.error('❌ ADMIN_SETUP_SECRET is not set in environment.');
      process.exit(1);
    }
    if (args.secret !== expected) {
      console.error('❌ Invalid setup secret.');
      process.exit(1);
    }
    console.log('✅ Setup secret verified.');
  }

  // Gather inputs (CLI args → interactive prompt)
  let email = args.email;
  let password = args.password;
  let fullName = args.name;

  if (!email) {
    email = await prompt('Admin email: ');
  }
  if (!password) {
    password = await prompt('Admin password: ');
  }
  if (!fullName) {
    fullName = await prompt('Admin full name: ');
  }

  // Basic validation
  if (!email || !password || !fullName) {
    console.error('❌ Email, password, and name are all required.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Please provide a valid email address.');
    process.exit(1);
  }

  // Connect to DB
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
  } catch (err) {
    console.error('❌ Unable to connect to the database:', err.message);
    process.exit(1);
  }

  // Check for existing admin with same email
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    console.error(`❌ A user with email "${email}" already exists.`);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

  // Create admin user + profile in a transaction
  const t = await sequelize.transaction();
  try {
    const user = await User.create(
      {
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isEmailVerified: true, // Admin doesn't need email verification
      },
      { transaction: t },
    );

    await AdminProfile.create(
      {
        userId: user.id,
        designation: 'System Administrator',
        department: 'Examination Branch',
      },
      { transaction: t },
    );

    await t.commit();

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  ✅  Admin user created successfully');
    console.log('═══════════════════════════════════════');
    console.log(`  Email : ${email.toLowerCase()}`);
    console.log(`  Name  : ${fullName.trim()}`);
    console.log(`  Role  : admin`);
    console.log(`  ID    : ${user.id}`);
    console.log('═══════════════════════════════════════');
    console.log('');
  } catch (err) {
    await t.rollback();
    console.error('❌ Failed to create admin user:', err.message);
    process.exit(1);
  }

  // Clean exit
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
