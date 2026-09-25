"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addToBrowsingHistory } from '@/utils/favoritesAndHistory';

export default function ProductViewTracker({ 
  productId, 
  productTitle, 
  category, 
  price = 0, 
  unit = 'unit', 
  image = null, 
  slug = null 
}) {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!productId) return;

    // Immediately record into client browsing history
    addToBrowsingHistory({
      id: productId,
      title: productTitle || 'Product',
      price,
      unit,
      image,
      slug: slug || productId,
      sector: category || 'General'
    });

    if (String(productId).startsWith('demo-')) return;

    const trackView = async () => {
      try {
        await fetch('/api/track/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId,
            productTitle: productTitle || null,
            category: category || null,
            price: Number(price) || 0,
            unit: unit || 'unit',
            image: image || null,
            slug: slug || null,
            userId: profile?.id || null,
            email: profile?.registered_email || user?.email || null,
            phone: profile?.corporate_phone || profile?.phone_number || null,
          })
        });
      } catch (err) {
        // Silently fail view tracking to avoid disrupting the user experience
        console.warn('Product view tracking notice:', err?.message);
      }
    };

    // 1-second delay so we log genuine views
    const timer = setTimeout(() => {
      trackView();
    }, 1000);

    return () => clearTimeout(timer);
  }, [productId, productTitle, category, price, unit, image, slug, user, profile]);

  return null; // Invisible component
}
