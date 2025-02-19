'use client';

import { Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Heart, X, ShoppingCart, Loader2 } from "lucide-react";
import { useWishlistQuery } from "@/src/libs/customHooks/useWishlist";
import { Button } from "../UI/Button";
import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "../UI/PriceDisplay";


interface WishlistDrawerProps { 
    isOpen: boolean;
    onClose: () => void;
}


export function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) { 
    const { 
        items, 
        isLoading, 
        moveItemToCart, 
        // clear, 
        removeItem,
        isMovingToCart,
        isEmpty,
        isRemoving,
    } = useWishlistQuery();


    if (isLoading) {
      return (
        <Transition show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={onClose}>
            <div className="fixed inset-0 bg-black bg-opacity-25" />
            <div className="fixed inset-0 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                  <div className="flex h-full items-center justify-center w-screen max-w-md">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition>
      );
    };


    return (
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <TransitionChild
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <TransitionChild
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <DialogPanel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        <div className="flex items-start justify-between">
                          <DialogTitle className="text-lg font-medium text-gray-900">
                            My Wishlist ({items.length})
                          </DialogTitle>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                              onClick={onClose}
                            >
                              <span className="absolute -inset-0.5" />
                              <span className="sr-only">Close panel</span>
                              <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        {isEmpty ? (
                          <div className="mt-20">
                            <div className="flex flex-col items-center justify-center text-center">
                              <Heart className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No items saved
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Add items you love to your wishlist
                              </p>
                              <div className="mt-6">
                                <Link href="/products">
                                  <Button onClick={onClose}>
                                    Browse Products
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-8">
                            <div className="flow-root">
                              <ul className="-my-6 divide-y divide-gray-200">
                                {items.map((item) => (
                                  <li key={item.id} className="flex py-6">
                                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                      <Image
                                        src={
                                          item.product.image ||
                                          "/placeholder.png"
                                        }
                                        alt={item.product.name}
                                        fill
                                        priority
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                      />
                                    </div>

                                    <div className="ml-4 flex flex-1 flex-col">
                                      <div>
                                        <div className="flex justify-between text-base font-medium text-gray-900">
                                          <h3>{item.product.name}</h3>
                                          <div>
                                            {item.product.discount_price ? (
                                              <div className="flex flex-col items-end">
                                                <PriceDisplay
                                                  amount={
                                                    item.product.discount_price
                                                  }
                                                  sourceCurrency="USD"
                                                />
                                                <PriceDisplay
                                                  amount={item.product.price}
                                                  sourceCurrency="USD"
                                                  className="text-sm text-gray-500 line-through"
                                                />
                                              </div>
                                            ) : (
                                              <PriceDisplay
                                                amount={item.product.price}
                                                sourceCurrency="USD"
                                              />
                                            )}
                                          </div>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                          {item.product.category.name}
                                        </p>
                                      </div>
                                      <div className="flex flex-1 items-end justify-between text-sm">
                                        <div className="flex space-x-2">
                                          <Button
                                            onClick={() =>
                                              moveItemToCart(item.product.id)
                                            }
                                            disabled={isMovingToCart}
                                            size="sm"
                                          >
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Move to Cart
                                          </Button>
                                          <Button
                                            onClick={() =>
                                              removeItem(item.product.id)
                                            }
                                            disabled={isRemoving}
                                            variant="outline"
                                            size="sm"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isEmpty && (
                        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                          <div className="mt-6">
                            <Link href="/wishlist" onClick={onClose}>
                              <Button className="w-full">
                                View Wishlist Page
                              </Button>
                            </Link>
                          </div>
                          <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                            <button
                              type="button"
                              className="font-medium text-blue-600 hover:text-blue-500"
                              onClick={onClose}
                            >
                              Continue Shopping
                              <span aria-hidden="true"> →</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
}