async function testLogisticsApi() {
  console.log('--- TESTING ADMIN LOGISTICS API ---');
  const res = await fetch('http://localhost:3000/api/admin/logistics');
  const json = await res.json();
  console.log('Status:', res.status, 'Success:', json.success, 'Count:', json.count);
  if (json.logistics && json.logistics.length > 0) {
    const sample = json.logistics[0];
    console.log('Sample Shipment:', {
      order_id: sample.order_id,
      tracking_number: sample.tracking_number,
      delivery_option: sample.delivery_option,
      dispatch_status: sample.dispatch_status,
      product_name: sample.product_name,
      buyer_company: sample.buyer_company,
      vehicle_number: sample.vehicle_number,
      driver_name: sample.p1_name || sample.receiver_name
    });
  }
}

testLogisticsApi();
