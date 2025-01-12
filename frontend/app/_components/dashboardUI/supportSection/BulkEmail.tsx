'use client';

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Input } from "../../UI/Input";
import { Button } from "../../UI/Button";
import { Alert } from "../../UI/Alert";
import { RichTextEditor } from "../../UI/RichTextEditor";
import { FileUpload } from "../../UI/FileUpload";
import { BulkEmailResponse, UploadedFile } from "@/src/types";
import { adminCustomerSupportService } from "@/src/libs/services/adminServices/adminCustomerSupportService";


interface BulkEmailProps {
    onClose: () => void;
    selectedCustomerIds: number[];
}


export function BulkEmail({ onClose, selectedCustomerIds }: BulkEmailProps) { 
    const [formData, setFormData] = useState({
        subject: "",
        body: "",
        attachments: [] as UploadedFile[],
    });
    const [alert, setAlert] = useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);


    const sendBulkEmail = useMutation({
        mutationFn: () => adminCustomerSupportService.sendBulkEmail({
            ...formData,
            customer_ids: selectedCustomerIds,
        }),
        onSuccess: (data: BulkEmailResponse) => {
            setAlert({
                type: "success",
                message: `Successfully sent ${data.successful_sends} out of ${data.total_customers
                    } emails.${data.failed_sends > 0 ? ` Failed: ${data.failed_sends}` : ""
                    }`,
            });
            setTimeout(onClose, 2000);
        },
        onError: () => {
            setAlert({
                type: "error",
                message: "Failed to send bulk emails. Please try again.",
            });
        }
    });


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.body) {
            setAlert({
                type: "error",
                message: "Please fill in all required fields.",
            });
            return;
        }
        sendBulkEmail.mutate();
    };


    const handleFileChange = (files: UploadedFile[]) => {
      setFormData((prev) => ({
        ...prev,
        attachments: files,
      }));
    };


    const handleFileRemove = (fileId: string) => {
      setFormData((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((file) => file.id !== fileId),
      }));
    };


    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Send Bulk Email
          </h2>
          <div className="text-sm text-gray-500">
            {selectedCustomerIds.length} customers selected
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subject: e.target.value }))
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <RichTextEditor
              content={formData.body}
              onChange={(content) =>
                setFormData((prev) => ({ ...prev, body: content }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={sendBulkEmail.isPending}
              disabled={sendBulkEmail.isPending}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Emails
            </Button>
          </div>
        </form>
      </div>
    );
}