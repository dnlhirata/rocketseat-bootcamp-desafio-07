import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const allProducts = await AsyncStorage.getItem('@GoMarketplace:products');

      if (allProducts) {
        setProducts(JSON.parse(allProducts));
      }
    }
    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(p => p.id === id);

      if (product) {
        if (product.quantity > 1) {
          const allProducts = products.map(p =>
            p.id === id ? { ...p, quantity: p.quantity - 1 } : p,
          );

          setProducts(allProducts);
        } else {
          const allProducts = products.filter(p => p.id !== id);

          setProducts(allProducts);
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExistsInCart = products.find(p => p.id === product.id);

      if (productExistsInCart) {
        increment(product.id);
        return;
      }

      setProducts(state => [...state, { ...product, quantity: 1 }]);

      await AsyncStorage.setItem(
        '@GoMarketplace:product',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
