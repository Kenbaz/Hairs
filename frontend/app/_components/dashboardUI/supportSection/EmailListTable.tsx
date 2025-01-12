'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Mail, Eye, Star, Clock, MoreVertical, Loader2, Trash } from "lucide-react";
import { EmailPreviewModal } from "./EmailPreviewModal";
import Link from "next/link";
import { EmailItem, EmailFilters } from "@/src/types";
import { Alert } from "../../UI/Alert";
import { Button } from "../../UI/Button";
import { adminCustomerSupportService } from "@/src/libs/services/adminServices/adminCustomerSupportService";
import { ConfirmModal } from "../../UI/ConfirmModal";


interface EmailListTableProps {
  filters: EmailFilters;
  onPageChange: (page: number) => void;
}

export function EmailListTable({ filters, onPageChange }: EmailListTableProps) {
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [previewEmail, setPreviewEmail] = useState<EmailItem | null>(null);
  const [emailToDelete, setEmailToDelete] = useState<EmailItem | null>(null);
  const [alert, setAlert] = useState<{
          type: 'success' | 'error';
          message: string;
      } | null>(null);

  const queryClient = useQueryClient();

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-emails", filters],
    queryFn: () => adminCustomerSupportService.getEmails(filters),
  });


  const deleteMutation = useMutation({
    mutationFn: (emailId: number) =>
      adminCustomerSupportService.deleteEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-emails"] });
      showAlert("success", "Email deleted successfully");
      setEmailToDelete(null);
    },
    onError: () => {
      showAlert("error", "Failed to delete email. Please try again.");
    },
  });

  const getStatusStyle = (status: EmailItem["status"]) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      read: "bg-green-100 text-green-800",
      delivered: "bg-purple-100 text-purple-800",
      failed: "bg-red-100 text-red-800",
    };
    return styles[status];
  };

  const getPriorityIcon = (priority: EmailItem["priority"]) => {
    if (priority === "high") return <Star className="h-5 w-5 text-red-500" />;
    if (priority === "medium")
      return <Star className="h-5 w-5 text-yellow-500" />;
    return <Star className="h-5 w-5 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">Failed to load emails</div>
    );
  }

  return (
    <>
      <EmailPreviewModal
        isOpen={previewEmail !== null}
        onClose={() => setPreviewEmail(null)}
        email={previewEmail}
      />
      {alert && (
        <Alert type={alert.type} message={alert.message} className="mb-4" />
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={emailToDelete !== null}
        onClose={() => setEmailToDelete(null)}
        onConfirm={() => {
          if (emailToDelete) {
            deleteMutation.mutate(emailToDelete.id);
          }
        }}
        title="Delete Email"
        message="Are you sure you want to delete this email? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.results.map((email) => (
                <tr key={email.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityIcon(email.priority)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setPreviewEmail(email)}
                      className="w-full text-left hover:bg-gray-50 rounded-md p-1 -m-1"
                    >
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {email.subject}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {email.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {email.customer_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(
                        email.status
                      )}`}
                    >
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {email.sent_at ? (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(email.sent_at), "MMM d, yyyy h:mm a")}
                      </div>
                    ) : (
                      format(new Date(email.created_at), "MMM d, yyyy h:mm a")
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setSelectedEmail(
                            selectedEmail === email.id ? null : email.id
                          )
                        }
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {selectedEmail === email.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <Link
                              href={`/admin/support/emails/${email.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                            {email.status === "draft" && (
                              <Link
                                href={`/admin/support/emails/compose?draft=${email.id}`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Edit Draft
                              </Link>
                            )}
                            <button
                              onClick={() => {
                                setEmailToDelete(email);
                                setSelectedEmail(null);
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(filters.page || 1) * (filters.page_size || 10) -
                    (filters.page_size || 10) +
                    1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    (filters.page || 1) * (filters.page_size || 10),
                    data.count
                  )}
                </span>{" "}
                of <span className="font-medium">{data.count}</span> emails
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange((filters.page || 1) - 1)}
                  disabled={!data.previous}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange((filters.page || 1) + 1)}
                  disabled={!data.next}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
