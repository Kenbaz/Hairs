"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "../UI/Input";
import { Button } from "../UI/Button";
import { Alert } from "../UI/Alert";
import { userAuthService } from "@/src/libs/services/customerServices/userAuthService";
import { ShippingAddressData } from "@/src/types";
import CountrySelect from "../UI/CountrySelect";

export default function ShippingAddressForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();


  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ShippingAddressData>();


  // Watch the country field value
  const countryValue = watch("country");


  const onSubmit = async (data: ShippingAddressData) => {
    try {
      setIsLoading(true);
      setAlert(null);

      await userAuthService.updateProfile(data);

      setAlert({
        type: "success",
        message: "Shipping address added successfully.",
      });
      router.push("/");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save shipping address.";
      setAlert({ type: "error", message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold">Add Shipping Address</h2>
        <p className="mt-2 text-[0.8rem] sm:text-sm text-gray-600">
          Please provide your shipping details to complete your profile
        </p>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} className="mb-4" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          <Input
            label="Street Address"
            {...register("address", { required: "Address is required" })}
            error={errors.address?.message}
            className="text-gray-900 focus:ring-1 focus:ring-black"
            disabled={isLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="City"
              {...register("city", { required: "City is required" })}
              error={errors.city?.message}
              className="text-gray-900 focus:ring-1 focus:ring-black"
              disabled={isLoading}
            />

            <Input
              label="State/Province"
              {...register("state", { required: "State is required" })}
              error={errors.state?.message}
              className="text-gray-900 focus:ring-1 focus:ring-black"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CountrySelect
              value={countryValue || ""}
              onChange={(value) => setValue("country", value)}
              error={errors.country?.message}
              className="text-gray-900 focus:ring-1 focus:ring-black"
              disabled={isLoading}
              required
            />

            <Input
              label="Postal Code"
              {...register("postal_code")}
              error={errors.postal_code?.message}
              className="text-gray-900 focus:ring-1 focus:ring-black"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          variant="default"
          type="submit"
          className="w-full bg-customBlack text-white"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Save Shipping Address
        </Button>
      </form>
    </div>
  );
}
