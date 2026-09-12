import React from 'react';
import PostPaymentFlow from '@/components/PostPaymentFlow';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Post-Payment Flow Test',
};

export default function TestFlowPage() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Checkout Simulation</h1>
            <p className="text-gray-500 mt-2">Interact with the post-payment logistics module below.</p>
          </div>
          <PostPaymentFlow 
            initialPhase={2}
            product={{ title: 'Kids School Uniform (White Shirt)' }}
            quantity={500}
            unit="Piece"
            pricePerUnit={159.89}
            subtotal={79945}
            gst={3997.25}
            total={83942.25}
            paymentData={{
              razorpay_payment_id: 'TXN-IND-655194',
              orderId: 'ORD-TEST-655194',
              advanceAmount: 8394.225
            }}
            initialEmail="procurement@company.com"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
