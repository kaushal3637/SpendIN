import { razorpayClient } from './razorpay';
import { CreateCustomerRequest, CreateQrCodeRequest, RazorpayCustomer, RazorpayQrCode } from './razorpay';

/**
 * Service for managing Razorpay test mode operations
 * Includes customer creation, QR code generation, and test data management
 */
export class RazorpayTestService {
  /**
   * Create test customers for testing payout functionality
   */
  async createTestCustomers(): Promise<RazorpayCustomer[]> {
    const testCustomers = [
      {
        name: 'Test Merchant 1',
        email: 'merchant1@test.com',
        contact: '9876543210',
        notes: { test_type: 'payout_testing', merchant_type: 'restaurant' }
      },
      {
        name: 'Test Merchant 2',
        email: 'merchant2@test.com',
        contact: '9876543211',
        notes: { test_type: 'payout_testing', merchant_type: 'retail' }
      },
      {
        name: 'Test Merchant 3',
        email: 'merchant3@test.com',
        contact: '9876543212',
        notes: { test_type: 'payout_testing', merchant_type: 'services' }
      }
    ];

    const createdCustomers: RazorpayCustomer[] = [];

    for (let i = 0; i < testCustomers.length; i++) {
      const customerData = testCustomers[i];

      // Add delay between API calls to prevent rate limiting
      if (i > 0) {
        console.log(`⏳ Waiting 1 second before creating next customer...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      try {
        // Try to create the customer
        const customer = await razorpayClient.createCustomer(customerData);
        createdCustomers.push(customer);
        console.log(`✅ Created test customer: ${customer.name} (${customer.id})`);
      } catch (error: unknown) {
        // Check if the error is because customer already exists
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage && errorMessage.includes('Customer already exists')) {
          console.log(`ℹ️ Customer ${customerData.name} already exists, finding existing customer...`);

          // Try to find the existing customer by email
          try {
            const allCustomers = await razorpayClient.getCustomers();
            const existingCustomer = allCustomers.items.find(c =>
              c.email === customerData.email ||
              c.contact === customerData.contact
            );

            if (existingCustomer) {
              createdCustomers.push(existingCustomer);
              console.log(`✅ Found existing customer: ${existingCustomer.name} (${existingCustomer.id})`);
            } else {
              console.error(`❌ Could not find existing customer ${customerData.name}`);
              throw new Error(`Customer ${customerData.name} already exists but could not be found`);
            }
          } catch (findError) {
            console.error(`❌ Failed to find existing customer ${customerData.name}:`, findError);
            throw findError;
          }
        } else {
          console.error(`❌ Failed to create customer ${customerData.name}:`, error);
          throw error;
        }
      }
    }

    return createdCustomers;
  }

  /**
   * Create QR codes for test customers
   */
  async createQrCodesForCustomers(customers: RazorpayCustomer[]): Promise<RazorpayQrCode[]> {
    const qrCodes: RazorpayQrCode[] = [];
    const amounts = [100, 250, 500]; // Different amounts for testing

    console.log(`🔄 Attempting to create QR codes for ${customers.length} customers...`);

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const amount = amounts[i % amounts.length];

      console.log(`📱 Creating QR code for ${customer.name} (₹${amount})...`);

      // Add delay between API calls to prevent rate limiting
      if (i > 0) {
        console.log(`⏳ Waiting 1 second before next API call...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const qrData: CreateQrCodeRequest = {
        type: 'upi_qr',
        name: `${customer.name} - ₹${amount}`,
        usage: 'multiple_use',
        fixed_amount: true,
        payment_amount: amount * 100, // Convert to paisa
        description: `Test QR for ${customer.name}`,
        customer_id: customer.id,
        notes: {
          test_customer: customer.id,
          test_amount: amount.toString(),
          created_for_testing: 'true'
        }
      };

      try {
        const qrCode = await razorpayClient.createQrCode(qrData);
        qrCodes.push(qrCode);
        console.log(`✅ Created UPI QR code for ${customer.name}: ${qrCode.id}`);
      } catch (error: unknown) {
        // Check if the error is because UPI is not enabled
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage && errorMessage.includes('UPI transactions are not enabled')) {
          console.log(`⚠️ UPI QR codes not enabled for ${customer.name}. Creating standard QR code instead.`);

          // Create a standard QR code instead - use 'bharat_qr' for test mode
          const standardQrData = {
            ...qrData,
            type: 'bharat_qr' as const, // Use Bharat QR for test mode
            usage: 'multiple_use' as const
          };

          try {
            const standardQrCode = await razorpayClient.createQrCode(standardQrData);
            qrCodes.push(standardQrCode);
            console.log(`✅ Created Bharat QR code for ${customer.name}: ${standardQrCode.id}`);
          } catch (standardError: unknown) {
            const errorMessage = standardError instanceof Error ? standardError.message : String(standardError);
            console.error(`❌ Failed to create Bharat QR code for ${customer.name}:`, errorMessage);
            console.log(`⚠️ Skipping QR code creation for ${customer.name}`);
            // Continue with other customers instead of failing completely
          }
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed to create QR code for ${customer.name}:`, errorMessage);
          console.log(`⚠️ Skipping QR code creation for ${customer.name}`);
          // Continue with other customers instead of failing completely
        }
      }
    }

    console.log(`✅ QR code creation completed. Created ${qrCodes.length} out of ${customers.length} QR codes.`);

    if (qrCodes.length === 0) {
      console.log('⚠️ No QR codes were created from Razorpay API.');
      console.log('💡 Creating mock QR codes with test UPI IDs for testing...');

      // Create mock QR codes with test UPI IDs
      const mockQrCodes: RazorpayQrCode[] = customers.map((customer, index) => {
        const amount = amounts[index % amounts.length];
        const testUpiIds = ['success@razorpay', 'failure@razorpay', 'pending@razorpay'];
        const testUpiId = testUpiIds[index % testUpiIds.length];

        // Generate UPI URI for testing
        const upiUri = `upi://pay?pa=${testUpiId}&pn=Test%20Merchant&am=${amount}&cu=INR`;

        return {
          id: `mock_qr_${customer.id}_${Date.now()}_${index}`,
          entity: 'qr_code',
          type: 'upi_qr',
          name: `${customer.name} - ₹${amount} (Mock)`,
          description: `Mock QR for testing with ${testUpiId}`,
          image_url: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // 1x1 transparent PNG as placeholder
          payment_amount: amount * 100, // in paisa
          status: 'active',
          usage: 'multiple_use',
          fixed_amount: true,
          customer_id: customer.id,
          created_at: Math.floor(Date.now() / 1000),
          upi_uri: upiUri,
          test_upi_id: testUpiId
        };
      });

      console.log(`✅ Created ${mockQrCodes.length} mock QR codes for testing`);
      return mockQrCodes;
    }

    return qrCodes;
  }

  /**
   * Create a single test customer
   */
  async createSingleTestCustomer(customerData: CreateCustomerRequest): Promise<RazorpayCustomer> {
    try {
      const customer = await razorpayClient.createCustomer({
        ...customerData,
        notes: {
          ...customerData.notes,
          created_for_testing: 'true',
          test_mode: 'true'
        }
      });
      console.log(`Created test customer: ${customer.name} (${customer.id})`);
      return customer;
    } catch (error) {
      console.error('Failed to create test customer:', error);
      throw error;
    }
  }

  /**
   * Create a single QR code for a customer
   */
  async createQrCodeForCustomer(
    customerId: string,
    amount: number,
    name?: string
  ): Promise<RazorpayQrCode> {
    try {
      const qrData: CreateQrCodeRequest = {
        type: 'upi_qr',
        name: name || `Test QR - ₹${amount}`,
        usage: 'multiple_use',
        fixed_amount: true,
        payment_amount: amount * 100, // Convert to paisa
        description: `Test QR code for ₹${amount}`,
        customer_id: customerId,
        notes: {
          test_customer: customerId,
          test_amount: amount.toString(),
          created_for_testing: 'true'
        }
      };

      const qrCode = await razorpayClient.createQrCode(qrData);
      console.log(`Created QR code: ${qrCode.id} for ₹${amount}`);
      return qrCode;
    } catch (error) {
      console.error('Failed to create QR code:', error);
      throw error;
    }
  }

  /**
   * Get all test customers (those with test_mode note)
   */
  async getTestCustomers(): Promise<RazorpayCustomer[]> {
    try {
      const allCustomers = await razorpayClient.getCustomers();
      // Filter customers that have test-related notes
      return allCustomers.items.filter(customer =>
        customer.notes?.test_mode === 'true' ||
        customer.notes?.created_for_testing === 'true' ||
        customer.notes?.test_type === 'payout_testing'
      );
    } catch (error) {
      console.error('Failed to get test customers:', error);
      throw error;
    }
  }

  /**
   * Get all test QR codes
   */
  async getTestQrCodes(): Promise<RazorpayQrCode[]> {
    try {
      const allQrCodes = await razorpayClient.getQrCodes();
      // Filter QR codes that have test notes
      return allQrCodes.items.filter(qr =>
        qr.notes?.created_for_testing === 'true' ||
        qr.customer_id // All QR codes linked to customers are likely test ones
      );
    } catch (error) {
      console.error('Failed to get test QR codes:', error);
      throw error;
    }
  }

  /**
   * Get complete test setup status
   */
  async getTestSetupStatus() {
    try {
      const [customers, qrCodes] = await Promise.all([
        this.getTestCustomers(),
        this.getTestQrCodes()
      ]);

      return {
        customers: customers.length,
        qrCodes: qrCodes.length,
        setupComplete: customers.length >= 2 && qrCodes.length >= 2,
        customerList: customers.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          contact: c.contact
        })),
        qrCodeList: qrCodes.map(q => ({
          id: q.id,
          name: q.name,
          amount: q.payment_amount ? q.payment_amount / 100 : null,
          status: q.status,
          customer_id: q.customer_id,
          image_url: q.image_url
        }))
      };
    } catch (error) {
      console.error('Failed to get test setup status:', error);
      throw error;
    }
  }

  /**
   * Clean up test data (close QR codes)
   */
  async cleanupTestData(): Promise<void> {
    try {
      const qrCodes = await this.getTestQrCodes();

      for (const qr of qrCodes) {
        if (qr.status === 'active') {
          try {
            await razorpayClient.closeQrCode(qr.id);
            console.log(`Closed QR code: ${qr.id}`);
          } catch (error) {
            console.error(`Failed to close QR code ${qr.id}:`, error);
          }
        }
      }

      console.log('Test data cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const razorpayTestService = new RazorpayTestService();
