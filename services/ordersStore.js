import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'direct_orders.json');

// Default initial sample orders to populate admin view if empty
const INITIAL_ORDERS = [
  {
    id: 'ORD-IND-902144',
    transaction_id: 'TXN-IND-884920',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    buyer_email: 'procurement@bharatagri.com',
    buyer_name: 'Rajesh Sharma',
    buyer_phone: '9820145678',
    product_id: '9ebcc043-99d8-47e7-8879-e6ae378420e3',
    product_name: 'Premium Basmati Rice 1121 (Aged 2yr)',
    quantity: 5000,
    unit: 'Kg',
    price_per_unit: 99.91,
    subtotal: 499550,
    gst: 24977.5,
    logistics_cost: 11500,
    total_amount: 536027.5,
    advance_amount: 53602.75,
    payment_status: 'paid_to_escrow',
    order_status: 'in_transit',
    delivery_option: 'deliver',
    delivery_date: '2026-09-02',
    delivery_address: 'Plot 42, APMC Market Yard, Phase II, Vashi, Navi Mumbai, Maharashtra 400703',
    receiver_name: 'Rajesh Sharma',
    receiver_phone: '9820145678',
    tracking_number: 'TRK-IND-99210',
    notes: 'Escrow 10% verified. Transport dispatch through Vashi logistics fleet.'
  },
  {
    id: 'ORD-IND-902145',
    transaction_id: 'TXN-IND-773192',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    buyer_email: 'purchase@swastikmed.in',
    buyer_name: 'Dr. Alok Verma',
    buyer_phone: '9876501234',
    product_id: 'demo-gloves-1',
    product_name: 'Nitrile Examination Gloves (Box of 100)',
    quantity: 1000,
    unit: 'Boxes',
    price_per_unit: 368,
    subtotal: 368000,
    gst: 18400,
    logistics_cost: 0,
    total_amount: 386400,
    advance_amount: 38640,
    payment_status: 'paid_to_escrow',
    order_status: 'ready_for_pickup',
    delivery_option: 'pickup',
    arrival_date: '2026-08-28',
    visitor_count: 2,
    p1_name: 'Suresh Patil (Driver)',
    p1_phone: '9819283746',
    p1_aadhar: '482910492817',
    p2_name: 'Alok Verma (Director)',
    p2_phone: '9876501234',
    p2_aadhar: '901827364510',
    tracking_number: 'GATE-PASS-2026-088',
    notes: 'Self-pickup scheduled at Central Godown. Hotel accommodation alert dispatched.'
  }
];

function ensureFileExists() {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE_PATH)) {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(INITIAL_ORDERS, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing orders store file:', err);
  }
}

export function readAllOrders() {
  ensureFileExists();
  try {
    const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(content || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading orders file:', err);
    return INITIAL_ORDERS;
  }
}

export function writeAllOrders(orders) {
  ensureFileExists();
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(orders, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing orders file:', err);
    return false;
  }
}

export function saveNewOrder(orderData) {
  const orders = readAllOrders();

  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  
  const generatedId = orderData.id || orderData.order_id || orderData.orderId || `ORD-IND-${timestamp.toString().slice(-6)}${randomSuffix}`;
  const generatedTxn = orderData.transaction_id || orderData.transactionId || `TXN-IND-${timestamp.toString().slice(-6)}${randomSuffix}`;

  const newOrder = {
    id: generatedId,
    transaction_id: generatedTxn,
    created_at: orderData.created_at || new Date().toISOString(),
    buyer_email: orderData.buyer_email || orderData.buyerEmail || 'buyer@example.com',
    buyer_name: orderData.buyer_name || orderData.buyerName || orderData.receiver_name || orderData.receiverName || orderData.p1_name || orderData.p1Name || 'Verified Buyer',
    buyer_phone: orderData.buyer_phone || orderData.buyerPhone || orderData.receiver_phone || orderData.receiverPhone || orderData.p1_phone || orderData.p1Phone || '',
    product_id: orderData.product_id || orderData.productId || 'custom-order',
    product_name: orderData.product_name || orderData.productName || orderData.productTitle || 'Commercial Trade Goods',
    quantity: Number(orderData.quantity) || 1,
    unit: orderData.unit || 'Units',
    price_per_unit: Number(orderData.price_per_unit || orderData.pricePerUnit) || 0,
    subtotal: Number(orderData.subtotal) || 0,
    gst: Number(orderData.gst) || 0,
    logistics_cost: Number(orderData.logistics_cost || orderData.logisticsCost) || 0,
    total_amount: Number(orderData.total_amount || orderData.totalAmount || orderData.total) || 0,
    advance_amount: Number(orderData.advance_amount || orderData.advanceAmount) || ((Number(orderData.total_amount || orderData.totalAmount || orderData.total) || 0) * 0.1),
    payment_status: orderData.payment_status || 'paid_to_escrow',
    order_status: orderData.order_status || 'confirmed',
    
    // Supplier specifics
    supplier_id: orderData.supplier_id || 'sup-aaudumbar-1',
    supplier_name: orderData.supplier_company_name || orderData.supplier_name || 'Aaudumbar Agro Pvt. Ltd.',
    supplier_company_name: orderData.supplier_company_name || orderData.supplier_name || 'Aaudumbar Agro Pvt. Ltd.',
    supplier_contact_person: orderData.supplier_contact_person || 'Aditya Patil',
    supplier_phone: orderData.supplier_phone || '+91 84088 41998',
    supplier_email: orderData.supplier_email || 'aaudumbaragro@gmail.com',
    supplier_gstin: orderData.supplier_gstin || '27ABACA6256A1Z2',
    supplier_location: orderData.supplier_location || 'Chhatrapati Sambhajinagar, Maharashtra',
    supplier_godown: orderData.supplier_godown || 'Central Godown, Plot 14, MIDC Shendra, Chhatrapati Sambhajinagar',

    // Logistics specifics
    delivery_option: orderData.delivery_option || orderData.deliveryOption || 'deliver',
    
    // Delivery fields
    delivery_date: orderData.delivery_date || orderData.deliveryDate || null,
    delivery_address: orderData.delivery_address || orderData.deliveryAddress || null,
    receiver_name: orderData.receiver_name || orderData.receiverName || null,
    receiver_phone: orderData.receiver_phone || orderData.receiverPhone || null,
    
    // Pickup fields
    arrival_date: orderData.arrival_date || orderData.arrivalDate || null,
    visitor_count: orderData.visitor_count ? parseInt(orderData.visitor_count) : (orderData.visitorCount ? parseInt(orderData.visitorCount) : null),
    vehicle_number: orderData.vehicle_number || orderData.vehicleNumber || null,
    p1_name: orderData.p1_name || orderData.p1Name || null,
    p1_phone: orderData.p1_phone || orderData.p1Phone || null,
    p1_aadhar: orderData.p1_aadhar || orderData.p1Aadhar || null,
    p2_name: orderData.p2_name || orderData.p2Name || null,
    p2_phone: orderData.p2_phone || orderData.p2Phone || null,
    p2_aadhar: orderData.p2_aadhar || orderData.p2Aadhar || null,

    tracking_number: orderData.tracking_number || null,
    notes: orderData.notes || 'Order placed via Direct Checkout Dock.'
  };

  // Prepend new order so latest is on top
  orders.unshift(newOrder);
  writeAllOrders(orders);

  return newOrder;
}

export function updateOrder(orderId, updates) {
  const orders = readAllOrders();
  const index = orders.findIndex(o => o.id === orderId || o.transaction_id === orderId || o.order_id === orderId);
  if (index === -1) return null;

  orders[index] = {
    ...orders[index],
    ...updates,
    updated_at: new Date().toISOString()
  };

  writeAllOrders(orders);
  return orders[index];
}

export function deleteOrder(orderId) {
  const orders = readAllOrders();
  const filtered = orders.filter(o => o.id !== orderId && o.transaction_id !== orderId && o.order_id !== orderId);
  writeAllOrders(filtered);
  return true;
}

export function findOrderById(orderId) {
  const orders = readAllOrders();
  return orders.find(o => o.id === orderId || o.transaction_id === orderId || o.order_id === orderId) || null;
}

// Alias exports for compatibility
export const getOrdersList = readAllOrders;

