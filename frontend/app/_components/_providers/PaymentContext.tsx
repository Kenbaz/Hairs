'use client';

import { createContext, useContext, useReducer, ReactNode } from "react";
import { PaymentState, PaymentContextType, InitializePaymentData, PaymentError } from "@/src/types";
import { paymentService } from "@/src/libs/services/paymentService/paymentService";
import { toast } from 'react-hot-toast';

interface PaymentProviderProps {
    children: ReactNode;
}

// Action types
type PaymentAction =
  | { type: "START_LOADING" }
  | { type: "SET_ERROR"; payload: PaymentError }
  | { type: "SET_PAYMENT_URL"; payload: string }
  | { type: "SET_PAYMENT_REFERENCE"; payload: string }
  | { type: "SET_PAYMENT_STATUS"; payload: PaymentState["paymentStatus"] }
  | { type: "INCREMENT_RETRY_COUNT" }
  | { type: "SET_LAST_ATTEMPT"; payload: Date }
  | { type: "SET_TIMEOUT_ID"; payload: NodeJS.Timeout | null }
  | { type: "RESET_RETRY_COUNT" }
  | { type: "RESET_PAYMENT" };
  
// Initial state
const initialState: PaymentState = {
  isLoading: false,
  error: null,
  paymentUrl: null,
  paymentReference: null,
  paymentStatus: "idle",
  retryCount: 0,
  lastAttempt: null,
  timeoutId: null,
};

// Create context
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);


// Create context
function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
    switch (action.type) {
      case "START_LOADING":
        return { ...state, isLoading: true, error: null };
      case "SET_ERROR":
        return { ...state, isLoading: false, error: action.payload };
      case "SET_PAYMENT_URL":
        return { ...state, isLoading: false, paymentUrl: action.payload };
      case "SET_PAYMENT_REFERENCE":
        return { ...state, paymentReference: action.payload };
      case "SET_PAYMENT_STATUS":
        return { ...state, paymentStatus: action.payload, isLoading: false };
      case "RESET_PAYMENT":
        return initialState;
      case "INCREMENT_RETRY_COUNT":
        return { ...state, retryCount: state.retryCount + 1 };
      case "SET_LAST_ATTEMPT":
        return { ...state, lastAttempt: action.payload };
      case "SET_TIMEOUT_ID":
        return { ...state, timeoutId: action.payload };
      case "RESET_RETRY_COUNT":
        return { ...state, retryCount: 0, lastAttempt: null };
      default:
        return state;
    }
};


// Provider component
export function PaymentProvider({ children }: PaymentProviderProps) { 
    const [state, dispatch] = useReducer(paymentReducer, initialState);

    const handlePaymentTimeout = () => {
        dispatch({
            type: 'SET_ERROR',
            payload: {
                type: 'TIMEOUT',
                message: 'Payment request timed out. Please try again.'
            }
        });
        dispatch({ type: 'SET_PAYMENT_STATUS', payload: 'failed' });
        toast.error('Payment request timed out');
    };

    const clearPaymentTimeout = () => {
        if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            dispatch({ type: 'SET_TIMEOUT_ID', payload: null });
        }
    };

    const setPaymentTimeout = () => {
        clearPaymentTimeout();
        const timeoutId = setTimeout(
            handlePaymentTimeout,
            Number(process.env.NEXT_PUBLIC_PAYMENT_TIMEOUT) || 300000
        );
        dispatch({ type: 'SET_TIMEOUT_ID', payload: timeoutId });
    };
    

    const initializePayment = async (data: InitializePaymentData) => {
        // Check retry count
        if (state.retryCount > 3) {
            dispatch({
              type: "SET_ERROR",
              payload: {
                type: "RETRY_LIMIT",
                message: "Maximum retry attempts reached. Please contact support.",
              },
            });
            return;
        }

        // Check if there is a need to wait between retries
        if (state.lastAttempt) {
            const waitTime = 5000; // 5 seconds
            const timeSinceLastAttempt = Date.now() - state.lastAttempt.getTime();
            if (timeSinceLastAttempt < waitTime) { 
                dispatch({
                  type: "SET_ERROR",
                  payload: {
                    type: "RATE_LIMIT",
                    message: "Please wait a moment before trying again.",
                  },
                });
                return;
            }
        }

        dispatch({ type: 'START_LOADING' });
        setPaymentTimeout();
        
        try {
            const response = await paymentService.initializePayment(data);

            clearPaymentTimeout();

            dispatch({ type: 'SET_PAYMENT_URL', payload: response.authorization_url });
            dispatch({ type: 'SET_PAYMENT_REFERENCE', payload: response.reference });
            dispatch({ type: 'SET_PAYMENT_STATUS', payload: 'pending' });
            dispatch({ type: "INCREMENT_RETRY_COUNT" });
            dispatch({ type: "SET_LAST_ATTEMPT", payload: new Date() });
        } catch (error: unknown) {
            clearPaymentTimeout();
            const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
            dispatch({
              type: "SET_ERROR",
              payload: {
                type: "NETWORK",
                message: errorMessage,
              },
            });
            toast.error(errorMessage);
            console.error(errorMessage);
        }
    };


    const verifyPayment = async (reference: string) => {
        dispatch({ type: 'START_LOADING' });
        
        try {
            const response = await paymentService.verifyPayment(reference);

            const isVerified = response.verified;

            dispatch({
                type: 'SET_PAYMENT_STATUS',
                payload: isVerified ? 'success' : 'failed',
            });

            if (isVerified) {
                toast.success('Payment verified successfully');
            } else {
                toast.error('Payment verification failed');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
            dispatch({
              type: "SET_ERROR",
              payload: {
                type: "VALIDATION",
                message: "Payment verification failed",
              },
            });
            toast.error('Payment verification failed');
            console.error(errorMessage);
        }
    };


    const resetPayment = () => {
        dispatch({ type: 'RESET_PAYMENT' });
    };

    const value = {
        ...state,
        initializePayment,
        verifyPayment,
        resetPayment,
    };

    return (
        <PaymentContext.Provider value={value}>
            {children}
        </PaymentContext.Provider>
    );
}

// Custom hook to use the payment context
export function usePayment() {
    const context = useContext(PaymentContext);
    if (context === undefined) {
        throw new Error('usePayment must be used within a PaymentProvider');
    }
    return context;
}