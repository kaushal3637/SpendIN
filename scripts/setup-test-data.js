#!/usr/bin/env node

/**
 * Quick setup script for Razorpay test data
 * Run with: node scripts/setup-test-data.js
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkAppStatus() {
  return new Promise((resolve) => {
    const url = new URL(`${API_BASE}/api/razorpay/test-setup`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function setupTestData() {
  console.log('🚀 Starting Razorpay test data setup...\n');

  // Check if the app is running
  console.log('🔍 Checking if Next.js app is running...');
  const isRunning = await checkAppStatus();

  if (!isRunning) {
    console.log('❌ Next.js app is not running on http://localhost:3000');
    console.log('📋 Please start your app first:');
    console.log('   yarn dev');
    console.log('   or');
    console.log('   npm run dev');
    return;
  }

  console.log('✅ Next.js app is running\n');

  try {
    // Step 1: Create test customers
    console.log('📝 Creating test customers...');
    const customerResponse = await makeRequest('/api/razorpay/test-setup', 'POST', {
      action: 'create_customers'
    });

    if (customerResponse.success) {
      console.log(`✅ Created ${customerResponse.customers.length} test customers:`);
      customerResponse.customers.forEach(customer => {
        console.log(`   - ${customer.name} (${customer.id})`);
      });
    } else {
      console.log(`❌ Failed to create customers: ${customerResponse.error}`);
      return;
    }

    console.log('');

    // Step 2: Create QR codes
    console.log('📱 Creating QR codes...');

    // Add a small delay to ensure customers are available
    console.log('⏳ Waiting for customers to be available...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Debug: Check what customers are available
    console.log('🔍 Checking available customers...');
    const statusResponse = await makeRequest('/api/razorpay/test-setup', 'GET');
    if (statusResponse.success) {
      console.log(`   Found ${statusResponse.customers} customers in status check`);
      if (statusResponse.customerList) {
        console.log('   Available customers:');
        statusResponse.customerList.forEach((customer, index) => {
          console.log(`     ${index + 1}. ${customer.name} (${customer.id})`);
        });
      }
    }

    const qrResponse = await makeRequest('/api/razorpay/test-setup', 'POST', {
      action: 'create_qr_codes'
    });

      if (qrResponse.success && qrResponse.qrCodes && qrResponse.qrCodes.length > 0) {
        const isMock = qrResponse.qrCodes[0].is_mock;
        console.log(`✅ Created ${qrResponse.qrCodes.length} ${isMock ? 'mock' : ''} QR codes:`);
        qrResponse.qrCodes.forEach(qr => {
          console.log(`   - ${qr.name} (₹${qr.amount}) - ${qr.id}`);
          if (qr.test_upi_id) {
            console.log(`     Test UPI: ${qr.test_upi_id}`);
          }
          if (qr.upi_uri) {
            console.log(`     UPI URI: ${qr.upi_uri}`);
          }
        });

        if (isMock) {
          console.log('\n🎯 Mock QR codes are ready for testing!');
          console.log('💡 These use Razorpay test UPI IDs for payment simulation');
        }
      } else {
        console.log(`⚠️ QR code creation failed: ${qrResponse.error}`);
        console.log('💡 This is common with Razorpay test accounts that don\'t have UPI enabled.');
      }

    console.log('');

    // Step 3: Show summary
    console.log('🎉 Test setup complete!');
    console.log(`   Customers: ${customerResponse.customers.length}`);

    // Show QR code count only if successful
    if (qrResponse.success && qrResponse.qrCodes) {
      console.log(`   QR Codes: ${qrResponse.qrCodes.length}`);
    } else {
      console.log('   QR Codes: 0 (not available on test account)');
    }

    if (customerResponse.customers && customerResponse.customers.length > 0) {
      console.log(`\n📋 Created Customers:`);
      customerResponse.customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.name} (${customer.email})`);
      });
    }

    if (qrResponse.success && qrResponse.qrCodes && qrResponse.qrCodes.length > 0) {
      const isMock = qrResponse.qrCodes[0].is_mock;
      console.log(`\n📱 Created ${isMock ? 'Mock ' : ''}QR Codes:`);
      qrResponse.qrCodes.forEach((qr, index) => {
        console.log(`   ${index + 1}. ${qr.name} - ₹${qr.amount} (${qr.status})`);
        if (qr.test_upi_id) {
          console.log(`      Test UPI ID: ${qr.test_upi_id}`);
        }
      });

      if (isMock) {
        console.log('\n🎯 Mock QR codes use Razorpay test UPI IDs:');
        console.log('   • success@razorpay - Always succeeds');
        console.log('   • failure@razorpay - Always fails');
        console.log('   • pending@razorpay - Stays pending');
      }
    } else {
      console.log('\n📱 QR Codes: Not available (UPI not enabled on test account)');
    }

    console.log('\n🔗 Access your test setup at: http://localhost:3000/test-setup');
    console.log('\n💡 You can still test payout functionality using:');
    console.log('   - success@razorpay (always succeeds)');
    console.log('   - failure@razorpay (always fails)');
    console.log('   - pending@razorpay (stays pending)');
    console.log('\n📊 Visit the web interface for manual testing and QR code management!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your app is running on http://localhost:3000');
    console.log('   2. Check your Razorpay test credentials in .env.local');
    console.log('   3. Ensure RAZORPAY_API_KEY, RAZORPAY_API_SECRET are set');
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');

  // Check if the app is running
  console.log('🔍 Checking if Next.js app is running...');
  const isRunning = await checkAppStatus();

  if (!isRunning) {
    console.log('❌ Next.js app is not running on http://localhost:3000');
    console.log('📋 Please start your app first:');
    console.log('   yarn dev');
    console.log('   or');
    console.log('   npm run dev');
    return;
  }

  console.log('✅ Next.js app is running\n');

  try {
    const response = await makeRequest('/api/razorpay/test-setup', 'DELETE');

    if (response.success) {
      console.log('✅ Test data cleanup completed');
    } else {
      console.log(`❌ Cleanup failed: ${response.error}`);
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

async function checkStatus() {
  console.log('📊 Checking test setup status...\n');

  // Check if the app is running
  console.log('🔍 Checking if Next.js app is running...');
  const isRunning = await checkAppStatus();

  if (!isRunning) {
    console.log('❌ Next.js app is not running on http://localhost:3000');
    console.log('📋 Please start your app first:');
    console.log('   yarn dev');
    console.log('   or');
    console.log('   npm run dev');
    return;
  }

  console.log('✅ Next.js app is running\n');

  try {
    const response = await makeRequest('/api/razorpay/test-setup');

    if (response.success) {
      console.log(`📈 Current Status:`);
      console.log(`   Customers: ${response.customers}`);
      console.log(`   QR Codes: ${response.qrCodes}`);
      console.log(`   Setup Complete: ${response.setupComplete ? '✅' : '❌'}`);

      if (response.customerList && response.customerList.length > 0) {
        console.log(`\n📋 Test Customers:`);
        response.customerList.forEach((customer, index) => {
          console.log(`   ${index + 1}. ${customer.name} (${customer.email})`);
        });
      }

      if (response.qrCodeList && response.qrCodeList.length > 0) {
        console.log(`\n📱 Test QR Codes:`);
        response.qrCodeList.forEach((qr, index) => {
          console.log(`   ${index + 1}. ${qr.name} - ₹${qr.amount} (${qr.status})`);
        });
      }
    } else {
      console.log(`❌ Status check failed: ${response.error}`);
    }
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupTestData();
    break;
  case 'cleanup':
    cleanupTestData();
    break;
  case 'status':
    checkStatus();
    break;
  default:
    console.log('📖 Razorpay Test Data Setup Script');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/setup-test-data.js setup    # Create test customers and QR codes');
    console.log('  node scripts/setup-test-data.js cleanup  # Remove test data');
    console.log('  node scripts/setup-test-data.js status   # Check current setup status');
    console.log('');
    console.log('Make sure your Next.js app is running on http://localhost:3000');
    break;
}
