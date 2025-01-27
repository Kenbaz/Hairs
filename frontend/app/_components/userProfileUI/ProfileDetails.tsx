"use client";

import { useState, FC, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "../UI/Alert";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { userProfileService } from "@/src/libs/services/customerServices/userProfileService";
import { UpdateProfileData } from "@/src/types";
import { useAppSelector } from "@/src/libs/_redux/hooks";
import { selectUser } from "@/src/libs/_redux/authSlice";
import CountrySelect from "../UI/CountrySelect";


export const ProfileDetails: FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const queryClient = useQueryClient();
  const currentUser = useAppSelector(selectUser);

  // Fetch profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userProfileService.getProfile(),
  });

    
  // Initialize form data when profile data changes
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
        postal_code: profile.postal_code || "",
      });
    }
  }, [profile]);

    
  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdateProfileData) =>
      userProfileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
    },
  });

    
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
  };

    
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

    
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

    
  if (!profile) {
    return <Alert type="error" message="Failed to load profile" />;
  }

    
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Profile Information</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit Profile
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            disabled={!isEditing || isUpdating}
            required
          />

          <Input
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            disabled={!isEditing || isUpdating}
            required
          />

          <Input
            label="Email"
            value={currentUser?.email || ""}
            disabled={true}
            type="email"
          />

          <Input
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            disabled={!isEditing || isUpdating}
          />
        </div>

        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Street Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing || isUpdating}
            />

            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!isEditing || isUpdating}
            />

            <Input
              label="State/Province"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={!isEditing || isUpdating}
            />

            <CountrySelect
              value={formData.country || ""}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, country: value }))
              }
              disabled={!isEditing || isUpdating}
            />

            <Input
              label="Postal Code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              disabled={!isEditing || isUpdating}
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isUpdating} disabled={isUpdating}>
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
