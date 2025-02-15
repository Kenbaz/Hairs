"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings, AlertTriangle } from "lucide-react";
import { Alert } from "@/app/_components/UI/Alert";
import { adminReturnPolicyService } from "@/src/libs/services/adminServices/adminReturnPolicyService";
import { ReturnPolicy } from "@/src/types";
import { GlobalPolicyForm } from "./GlobalReturnPolicyForm";


export default function ReturnPolicyManagement() {
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch global policy
  const {
    data: globalPolicy,
    isLoading: isPoliciesLoading,
    error: policiesError,
  } = useQuery({
    queryKey: ["global-return-policy"],
    queryFn: async () => {
      const response = await adminReturnPolicyService.getPolicies();
      // Extract the first policy from the results array
      return response.results && response.results.length > 0
        ? response.results[0]
        : null;
    },
  });

  // Create/Update global policy mutation
  const globalPolicyMutation = useMutation({
    mutationFn: async (data: ReturnPolicy) => {
      if (globalPolicy) {
        return adminReturnPolicyService.updateGlobalPolicy(data);
      } else {
        return adminReturnPolicyService.createGlobalPolicy(data);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["global-return-policy"] });
      setAlert({
        type: "success",
        message: "Global return policy saved successfully",
      });
    },
    onError: () => {
      setAlert({
        type: "error",
        message: "Failed to save global return policy",
      });
    },
  });

  if (isPoliciesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
      </div>
    );
  }

  if (policiesError) {
    return (
      <Alert
        type="error"
        message="Failed to load return policies"
        className="mb-4"
      />
    );
  }
  

  return (
    <div className="space-y-6 h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl text-gray-900 font-semibold">
            Returns Policy Settings
          </h1>
        </div>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} className="mb-4" />
      )}

      {/* Global Policy Section */}
      <div className="bg-white rounded-lg shadow h-full">
        <div>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Global Returns Policy
            </h2>

            {!globalPolicy && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      No Global Policy Set
                    </h3>
                    <p className="mt-2 text-sm text-yellow-700">
                      Set up a global return policy that will apply to all
                      products by default.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <GlobalPolicyForm
              policy={globalPolicy}
              isLoading={globalPolicyMutation.isPending}
              onSubmit={(data) => globalPolicyMutation.mutate(data)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
