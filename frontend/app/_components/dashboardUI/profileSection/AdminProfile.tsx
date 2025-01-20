'use client';

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector, useAppDispatch } from "@/src/libs/_redux/hooks";
import { selectUser } from "@/src/libs/_redux/authSlice";
import { ImageUpload } from "@/app/_components/UI/ImageUpload";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { Alert } from "@/app/_components/UI/Alert";
import { ChangePassword } from "../../_authForms/ChangePassword";
import { Loader2 } from "lucide-react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminProfileService } from "@/src/libs/services/adminServices/adminProfileService";
import { AxiosError } from "axios";
import { ApiError } from "@/src/types";
import { updateUserData } from "@/src/libs/_redux/authSlice";


// Form validation schema
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AdminProfile() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [avatar, setAvatar] = useState<File[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await adminProfileService.updateProfile(data);
    },
    onSuccess: async (updatedProfile) => {
      // Update Redux state with new user data
      await dispatch(updateUserData(updatedProfile));

      queryClient.invalidateQueries({ queryKey: ["user"] });

      setAlert({ type: "success", message: "Profile updated successfully" });
    },
    onError: (error) => {
      const err = error as AxiosError<ApiError>;
      setAlert({
        type: "error",
        message: err.response?.data?.message || "Failed to update profile",
      });
      console.error("Profile update error:", error);
    },
  });

  const handleAvatarChange = (files: File[]) => {
    setAvatar(files);
  };

  const handleAvatarRemove = (index: number) => {
    setAvatar((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ProfileFormValues) => {
    const formData = new FormData();

    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    // Add avatar if present
    if (avatar.length > 0) {
      const file = avatar[0];
      formData.append("avatar", file, file.name);
    }

    mutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "general"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("general")}
        >
          General Information
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "security"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === "general" && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Profile Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal information and profile picture
              </p>
            </div>

            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                className="mb-6"
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="mt-2">
                  <ImageUpload
                    value={avatar}
                    onChange={handleAvatarChange}
                    onRemove={handleAvatarRemove}
                    maxFiles={1}
                    maxSize={2 * 1024 * 1024} // 2MB
                  />
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  {...register("first_name")}
                  error={errors.first_name?.message}
                />
                <Input
                  label="Last Name"
                  {...register("last_name")}
                  error={errors.last_name?.message}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                {...register("email")}
                error={errors.email?.message}
              />

              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={mutation.isPending}
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </div>
        )}

        {activeTab === "security" && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Security Settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your password and security preferences
              </p>
            </div>
            <ChangePassword />
          </div>
        )}
      </div>
    </div>
  );
}