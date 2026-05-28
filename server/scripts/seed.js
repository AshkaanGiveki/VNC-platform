const mongoose = require('mongoose');
require('../src/config/database').connectDatabase();
const User = require('../src/models/User');
const Image = require('../src/models/Image');
const Organization = require('../src/models/Organization');
const Workspace = require('../src/models/Workspace');
const UserWorkspace = require('../src/models/UserWorkspace');
const PolicyTemplate = require('../src/models/PolicyTemplate');
const { ROLES } = require('../src/utils/constants');

async function seed() {
  // Clean existing data (optional – remove if you want to keep old data)
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Image.deleteMany({}),
    Workspace.deleteMany({}),
    UserWorkspace.deleteMany({}),
    PolicyTemplate.deleteMany({}),
  ]);

  // Create superadmin
  const superadmin = await User.create({
    email: 'superadmin@workspace.com',
    password: 'SuperAdmin123!',
    role: ROLES.SUPERADMIN,
    firstName: 'Super',
    lastName: 'Admin',
    isActive: true,
  });
  console.log('Superadmin:', superadmin.email);

  // Create an organization
  const org = await Organization.create({
    name: 'شرکت نمونه',
    domain: 'sample',
    defaultPolicy: {
      filePersistence: false,
      clipboard: true,
      audio: true,
      webcam: false,
      microphone: false,
      downloadEnabled: true,
      uploadEnabled: true,
      maxSessionDuration: 60,
    },
    settings: {
      maxUsers: 50,
      maxSessionsPerUser: 3,
      recordingEnabled: true,
    },
  });

  // Create org_admin and regular user
  const orgAdmin = await User.create({
    email: 'admin@sample.com',
    password: 'AdminPass1!',
    role: ROLES.ORG_ADMIN,
    firstName: 'مدیر',
    lastName: 'سازمان',
    organizationId: org._id,
    isActive: true,
  });

  const regularUser = await User.create({
    email: 'user@sample.com',
    password: 'UserPass1!',
    role: ROLES.USER,
    firstName: 'کاربر',
    lastName: 'عادی',
    organizationId: org._id,
    isActive: true,
  });

  // Create images
  const images = await Image.insertMany([
    { name: 'Ubuntu 22.04', type: 'ubuntu', dockerImage: 'kasmweb/ubuntu:1.14.0', isEnabled: true },
    { name: 'Chrome', type: 'chrome', dockerImage: 'kasmweb/chrome:1.14.0', isEnabled: true },
    { name: 'Firefox', type: 'firefox', dockerImage: 'kasmweb/firefox:1.14.0', isEnabled: true },
    { name: 'OnlyOffice', type: 'onlyoffice', dockerImage: 'kasmweb/onlyoffice:1.14.0', isEnabled: true },
  ]);

  // Create a default policy template
  const policyTemplate = await PolicyTemplate.create({
    organizationId: org._id,
    name: 'Standard',
    options: {
      filePersistence: true,
      clipboard: true,
      downloadEnabled: true,
      uploadEnabled: true,
      maxSessionDuration: 120,
    },
    isDefault: true,
  });

  // Create a workspace
  const workspace = await Workspace.create({
    organizationId: org._id,
    name: 'دسکتاپ توسعه',
    imageId: images[0]._id,
    resources: { cpu: 2, memory: 2048, disk: 20 },
    policy: {
      templateId: policyTemplate._id,
      overrides: {},
    },
    isActive: true,
  });

  // Assign workspace to the regular user
  await UserWorkspace.create({
    userId: regularUser._id,
    workspaceId: workspace._id,
    organizationId: org._id,
    assignedBy: orgAdmin._id,
  });

  console.log('Seed completed. You can now log in as:');
  console.log('Superadmin : superadmin@workspace.com / SuperAdmin123!');
  console.log('Org Admin  : admin@sample.com / AdminPass1!');
  console.log('Regular User: user@sample.com / UserPass1!');
  process.exit(0);
}

seed();