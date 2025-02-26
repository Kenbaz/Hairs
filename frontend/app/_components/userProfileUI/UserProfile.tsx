'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { userProfileService } from "@/src/libs/services/customerServices/userProfileService";
import { UpdateProfileData } from "@/src/types";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { Alert } from "@/app/_components/UI/Alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CountrySelect from "@/app/_components/UI/CountrySelect";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { ChangePassword } from "../_authForms/ChangePassword";


export default function UserProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { 
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<UpdateProfileData>();

    const countryValue = watch('country');

    // Fetch profile data
    const {data: profile, isLoading: isLoadingProfile} = useQuery({
        queryKey: ['user-profile'],
        queryFn: () => userProfileService.getProfile(),
    })

    // Reset form when profile data changes or edit mode is disabled
    useEffect(() => {
        if (profile && !isEditing) {
            reset({
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone_number: profile.phone_number || '',
                address: profile.address || '',
                city: profile.city || '',
                state: profile.state || '',
                country: profile.country || '',
                postal_code: profile.postal_code || '',
            });
        }
    }, [profile, isEditing, reset]);

    // Update profile mutation
    const { mutate: updateProfile, isPending: isUpdating } = useMutation({
        mutationFn: (data: UpdateProfileData) => userProfileService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            setIsEditing(false);
        },
    });

    const onSubmit = (data: UpdateProfileData) => {
        updateProfile(data);
    };

    if (isLoadingProfile) {
      return (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    };

    if (!profile) {
      return <Alert type="error" message="Failed to load profile" />;
    }


    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Profile
            </Button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Personal Information
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  {...register("first_name", {
                    required: "First name is required",
                  })}
                  error={errors.first_name?.message}
                  disabled={!isEditing || isUpdating}
                />

                <Input
                  label="Last Name"
                  {...register("last_name", {
                    required: "Last name is required",
                  })}
                  error={errors.last_name?.message}
                  disabled={!isEditing || isUpdating}
                />

                <Input
                  label="Email"
                  value={user?.email}
                  disabled={true}
                  type="email"
                />

                <Input
                  label="Phone Number"
                  {...register("phone_number")}
                  error={errors.phone_number?.message}
                  disabled={!isEditing || isUpdating}
                />
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Street Address"
                    {...register("address")}
                    error={errors.address?.message}
                    disabled={!isEditing || isUpdating}
                  />

                  <Input
                    label="City"
                    {...register("city")}
                    error={errors.city?.message}
                    disabled={!isEditing || isUpdating}
                  />

                  <Input
                    label="State/Province"
                    {...register("state")}
                    error={errors.state?.message}
                    disabled={!isEditing || isUpdating}
                  />

                  <CountrySelect
                    value={countryValue || ""}
                    onChange={(value) => setValue("country", value)}
                    error={errors.country?.message}
                    disabled={!isEditing || isUpdating}
                  />

                  <Input
                    label="Postal Code"
                    {...register("postal_code")}
                    error={errors.postal_code?.message}
                    disabled={!isEditing || isUpdating}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      reset();
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isUpdating}>
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Password</h2>
              <Button
                variant="outline"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? "Cancel" : "Change Password"}
              </Button>
            </div>

            {showPasswordSection && <ChangePassword />}
          </div>
        </div>
      </div>
    );
}