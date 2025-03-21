"use client";

import { CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";

interface OrderStatusTrackerProps {
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
}

export function OrderStatusTracker({ status }: OrderStatusTrackerProps) {
  const steps = [
    { id: "pending", label: "Order Placed", icon: Clock },
    { id: "processing", label: "Processing", icon: Package },
    { id: "shipped", label: "Shipped", icon: Truck },
    { id: "delivered", label: "Delivered", icon: CheckCircle },
  ];

  // Get the current step index
  const getCurrentStepIndex = () => {
    if (status === "cancelled") return -1;
    return steps.findIndex((step) => step.id === status);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="py-4">
      {status === "cancelled" ? (
        <div className="flex items-center justify-center bg-red-50 p-4 rounded-lg">
          <XCircle className="h-6 w-6 text-red-600 mr-2" />
          <span className="text-red-600 font-medium">
            This order has been cancelled
          </span>
        </div>
      ) : (
        <div className="relative">
          {/* Progress Bar */}
          <div className=" sm:block absolute left-0 top-[53%] sm:top-1/2 w-full h-0.5 -translate-y-1/2 bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${
                  currentStepIndex === 0
                    ? 0
                    : currentStepIndex === 1
                    ? 33
                    : currentStepIndex === 2
                    ? 66
                    : currentStepIndex === 3
                    ? 100
                    : 0
                }%`,
              }}
            ></div>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-4 sm:grid-cols-4 gap-2">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex sm:items-center ${
                    index < steps.length - 1 ? "mb-0 sm:mb-0" : ""
                  }`}
                >
                  <div className="flex flex-col items-center mb-0 sm:flex-col sm:mb-0">
                    <div
                      className={`
                      relative flex items-center justify-center w-10 h-10 rounded-full 
                      ${
                        isCompleted
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }
                      ${isCurrent ? "ring-2 ring-blue-300 ring-offset-2" : ""}
                      z-10
                    `}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="ml-0 mt-2 text-center sm:ml-0 sm:mt-2 flex-1 sm:text-center">
                      <p
                        className={`font-medium text-[0.8rem] sm:text-base ${
                          isCompleted ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {isCurrent
                          ? "In progress"
                          : isCompleted
                          ? "Completed"
                          : ""}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-6 bg-gray-200 ml-5 hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ height: isCompleted ? "100%" : "0%" }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
