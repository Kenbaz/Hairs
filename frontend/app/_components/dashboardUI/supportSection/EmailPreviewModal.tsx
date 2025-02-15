import { X, Download, Mail, Calendar, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../UI/Button";
import { EmailItem } from "@/src/types";


interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: EmailItem | null;
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  email,
}: EmailPreviewModalProps) {
  if (!isOpen || !email) return null;

  // Get current timestamp if no dates are provided
  const emailDate =
    email.sent_at || email.created_at || new Date().toISOString();
  
  
  const handleDownloadAttachment = (
    attachmentUrl: string,
    filename: string
  ) => {
    const link = document.createElement("a");
    link.href = attachmentUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full md:w-[80%] max-w-4xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Email Preview
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Subject */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {email.subject}
              </h2>
            </div>

            {/* Metadata */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm md:text-base lg:landscape:text-[0.9rem] text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span className="font-medium">From:</span>
                <span className="ml-2">{email.from_email}</span>
              </div>
              <div className="flex items-center text-sm md:text-base lg:landscape:text-[0.9rem] text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span className="font-medium">To:</span>
                <span className="ml-2">
                  {email.customer_name
                    ? `${email.customer_name} (${email.to_email})`
                    : email.to_email}
                </span>
              </div>
              <div className="flex items-center text-sm md:text-base lg:landscape:text-[0.9rem] text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Date:</span>
                <span className="ml-2">
                  {format(new Date(emailDate), "MMM d, yyyy h:mm a")}
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div
              className="prose max-w-none mb-6 text-gray-900 md:text-base lg:landscape:text-[0.9rem]"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-900 mb-2">
                  Attachments
                </h4>
                <div className="space-y-2">
                  {email.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {attachment.filename}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadAttachment(
                            attachment.file,
                            attachment.filename
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
