async function testLiveAllUsers360() {
  try {
    console.log('--- TESTING 360 INTELLIGENCE VIA NEXT.JS DEV SERVER ---');
    const res = await fetch('http://localhost:3000/api/admin/all-users');
    if (!res.ok) {
      console.log('Status:', res.status, await res.text());
      return;
    }
    const users = await res.json();
    console.log(`✅ Received ${users.length} users with complete 360 intelligence!`);
    
    // Find Aaudumbar Agro or first user
    const aaudumbar = users.find(u => (u.company_name || '').toLowerCase().includes('aaudumbar') || (u.full_name || '').toLowerCase().includes('aaudumbar')) || users[0];
    
    if (aaudumbar) {
      console.log('\n--- 360° DOSSIER FOR:', aaudumbar.company_name || aaudumbar.full_name, '---');
      console.log('• User ID / Display ID:', aaudumbar.id, '/', aaudumbar.display_id);
      console.log('• Contact Phone:', aaudumbar.corporate_phone || aaudumbar.phone_number);
      console.log('• Email:', aaudumbar.registered_email);
      console.log('• GST Number:', aaudumbar.gst_number, `(${aaudumbar.gst_verified ? 'Verified' : 'Unverified'})`);
      console.log('• Warehouse Location:', aaudumbar.warehouse_address, '| City:', aaudumbar.city, '| State:', aaudumbar.state);
      console.log('• Auth Provider & Last Login:', aaudumbar.auth_provider, '| Login Time:', aaudumbar.last_sign_in);
      console.log('• Subscription Plan:', aaudumbar.membership_plan, '| Expires:', aaudumbar.membership_expires_at);
      console.log('• Products Listed:', aaudumbar.products_count, 'products (Valuation: ₹' + aaudumbar.catalog_moq_valuation + ')');
      console.log('• RFQs Posted:', aaudumbar.rfqs_count);
      console.log('• Quotes Submitted:', aaudumbar.quotes_count);
      console.log('• Trade Orders:', aaudumbar.total_orders_count, '(Volume: ₹' + aaudumbar.total_trade_volume + ')');
      console.log('• Payments Logged:', aaudumbar.payments?.length);
      console.log('• Logistics Shipments:', aaudumbar.logistics_count);
      console.log('• Top Searches:', aaudumbar.top_searches);
    }
  } catch (err) {
    console.error('Error testing live endpoint:', err.message);
  }
}

testLiveAllUsers360();
