'use client';

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { X, ShoppingBag } from "lucide-react";
import { Cart } from "./Cart";


const slideInVariants = {
    hidden: { x: "100%" },
    visible: {
        x: "0%",
        transition: {
            type: "spring",
            damping: 30,
            stiffness: 300,
        },
    },
    exit: {
        x: "100%",
        transition: {
            type: "spring",
            damping: 30,
            stiffness: 300,
        },
    },
};


export function CartDrawer() {
  const { isCartOpen: isOpen, closeCart, cart, isLoading } = useCartQuery();
  const cartRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        closeCart();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeCart]);

  // Handle escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, closeCart]);
  
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={cartRef}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-customWhite shadow-xl z-50"
          variants={slideInVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
              {cart && cart.items.length > 0 && (
                <p className="text-sm text-gray-500">
                  {cart.items.length} items
                </p>
              )}
            </div>
            <button
              onClick={() => closeCart()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close cart"
            >
              <X className="h-7 w-7 text-gray-600" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="h-[calc(100vh-64px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : cart && cart.items.length > 0 ? (
              <Cart isDrawer={true} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-500">
                  Add items to your cart to see them here
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}