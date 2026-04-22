"use client";

import { useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  url: string;
  price: number;
  eventId: string;
  eventTitle: string;
}

export function useCart(eventId?: string) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('4dance_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("Erro ao carregar carrinho:", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sync with localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('4dance_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (itemId: string) => {
    return items.some(i => i.id === itemId);
  };

  const total = items.reduce((acc, item) => acc + item.price, 0);

  return {
    items,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    total,
    count: items.length,
    isLoaded
  };
}
