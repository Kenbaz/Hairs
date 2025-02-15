'use client';

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileUpload } from "../../UI/FileUpload";
import { RichTextEditor } from "../../UI/RichTextEditor";
import { Input } from "../../UI/Input";
import { Button } from "../../UI/Button";
import { Alert } from "../../UI/Alert";
import { Send, Save, Eye } from "lucide-react";
import { SendEmailData, EmailItem, UploadedFile } from "@/src/types";
import { adminCustomerSupportService } from "@/src/libs/services/adminServices/adminCustomerSupportService";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/src/libs/_redux/hooks";
import { selectUser } from "@/src/libs/_redux/authSlice";
import axiosInstance from "@/src/utils/_axios";

// Storage key for form data
const STORAGE_KEY = 'email_composer_data';


interface EmailComposerProps {
  draftId?: string;
  initialData?: EmailItem;
  onPreview?: (email: EmailItem) => void;
}

export default function EmailComposer({
  draftId,
  initialData,
  onPreview,
}: EmailComposerProps) {
  const router = useRouter();

  // Get admin user data from Redux store
  const user = useAppSelector(selectUser);

  // Form state
  const [formData, setFormData] = useState<SendEmailData>(() => {
    // Try to load from localStorage first
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
    // Otherwise use initialData or default values
    return {
      to_email: initialData?.to_email || "",
      from_email: initialData?.from_email || user?.email || "",
      subject: initialData?.subject || "",
      body: initialData?.body || "",
      attachments: initialData?.attachments || [],
    };
  });
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Save to localStorage whenever form data changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // Clear localStorage when navigating away or sending email
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    };
  }, []);


  // Image upload handler for rich text editor
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post('/api/v1/admin/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  // Send email mutation
  const sendMutation = useMutation({
    mutationFn: (data: SendEmailData) =>
      adminCustomerSupportService.sendEmail(data),
    onSuccess: () => {
      setAlert({ type: "success", message: "Email sent successfully" });
      localStorage.removeItem(STORAGE_KEY);
      router.push("/admin/support/emails");
    },
    onError: (error) => {
      setAlert({
        type: "error",
        message: "Failed to send email. Please try again.",
      });
      console.error("Send error:", error);
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: (data: SendEmailData) =>
      adminCustomerSupportService.saveDraft({
        ...data,
        id: draftId,
      }),
    onSuccess: () => {
      setAlert({ type: "success", message: "Draft saved successfully" });
      router.push("/admin/support/emails");
    },
    onError: (error) => {
      setAlert({
        type: "error",
        message: "Failed to save draft. Please try again.",
      });
      console.error("Save error:", error);
    },
  });

  // Handle file uploads
  const handleFileChange = (files: UploadedFile[]) => {
    setFormData((prev) => ({
      ...prev,
      attachments: files,
    }));
  };

  // Handle file removal
  const handleFileRemove = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((file) => file.id !== fileId) || [],
    }));
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    // Basic validation
    if (!formData.to_email || !formData.subject || !formData.body) {
      setAlert({ type: "error", message: "Please fill all required fields" });
      return;
    }

    try {
      await sendMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  // Handle draft saving
  const handleSaveDraft = async () => {
    if (!formData.to_email && !formData.subject && !formData.body) {
      return; // Don't save empty drafts
    }

    try {
      // Don't require all fields for drafts
      const draftData = {
        ...formData,
        // Ensure from_email is always set
        from_email: formData.from_email || "",
      };

      await saveDraftMutation.mutateAsync(draftData);
    } catch (error) {
      console.error("Draft save error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-[14%]">
      {alert && <Alert type={alert.type} message={alert.message} />}

      {/* Recipient */}
      <Input
        label="To"
        type="email"
        className="border rounded-lg text-base lg:landscape:text-[0.9rem] bg-gray-50 text-gray-900"
        value={formData.to_email}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            to_email: e.target.value,
          }))
        }
        required
      />

      {/* Subject */}
      <Input
        label="Subject"
        className="border rounded-lg text-base lg:landscape:text-[0.9rem] bg-gray-50 text-gray-900"
        value={formData.subject}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            subject: e.target.value,
          }))
        }
        required
      />

      {/* Rich Text Editor */}
      <div>
        <label className="block text-sm md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-700 mb-1">
          Message
        </label>
        <RichTextEditor
          content={formData.body}
          onChange={(content) =>
            setFormData((prev) => ({
              ...prev,
              body: content,
            }))
          }
          onImageUpload={handleImageUpload}
        />
      </div>

      {/* File Attachments */}
      <div>
        <label className="block text-sm md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-700 mb-1">
          Attachments
        </label>
        <FileUpload
          value={formData.attachments}
          onChange={handleFileChange}
          onRemove={handleFileRemove}
          maxFiles={5}
          maxSize={5 * 1024 * 1024} // 5MB
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {onPreview && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPreview(formData as EmailItem)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={saveDraftMutation.isPending}
        >
          <Save className="h-4 w-4 hidden md:inline-flex mr-2"/>
          Save Draft
        </Button>

        <Button
          type="submit"
          className="bg-slate-700 hover:bg-slate-800"
          size="sm"
          disabled={sendMutation.isPending}
          isLoading={sendMutation.isPending}
        >
          <Send className="h-4 w-4 mr-2" />
          Send Email
        </Button>
      </div>
    </form>
  );
}
