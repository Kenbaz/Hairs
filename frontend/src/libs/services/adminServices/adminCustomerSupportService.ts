import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import {
  EmailResponse,
  EmailFilters,
  EmailItem,
  SendEmailData,
  BulkEmailData,
  BulkEmailResponse,
} from "@/src/types";

interface SaveDraftData extends SendEmailData {
  id?: string;
}

class CustomerSupportService {
  private readonly baseUrl = "/api/v1/admin/";

  async getEmails(filters: EmailFilters = {}): Promise<EmailResponse> {
    try {
      const response = await axiosInstance.get<EmailResponse>(
        `${this.baseUrl}emails/`,
        {
          params: {
            ...filters,
            search: filters.search?.trim(),
            page_size: filters.page_size || 10,
            page: filters.page || 1,
          },
        }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch emails:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async getEmail(id: string): Promise<EmailItem> {
    try {
      const response = await axiosInstance.get<EmailItem>(
        `${this.baseUrl}emails/${id}/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch email:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async sendEmail(data: SendEmailData): Promise<EmailItem> {
    try {
      const formData = new FormData();
      formData.append("from_email", data.from_email);
      formData.append("to_email", data.to_email);
      formData.append("subject", data.subject);
      formData.append("body", data.body);

      // Append attachment if any
      if (data.attachments) {
        data.attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      const response = await axiosInstance.post<EmailItem>(
        `${this.baseUrl}emails/send_email/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Failed to send email:", err.response?.data || err.message);
      throw error;
    }
  };

  async sendBulkEmail(data: BulkEmailData): Promise<BulkEmailResponse> {
    try {
      const formData = new FormData();
      formData.append('subject', data.subject);
      formData.append('body', data.body);

      // Append customer ids as JSON string
      formData.append('customer_ids', JSON.stringify(data.customer_ids));

      // Append attachment if any
      if (data.attachments) {
        data.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      };

      const response = await axiosInstance.post<BulkEmailResponse>(
        `${this.baseUrl}emails/send_bulk_email/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Failed to send bulk email:', err.response?.data || err.message);
      throw error;
    }
  };

  async saveDraft(data: SaveDraftData): Promise<EmailItem> {
    try {
      const formData = new FormData();

      // Add available fields, allowing empty values for drafts
      if (data.subject) formData.append("subject", data.subject);
      if (data.body) formData.append("body", data.body);
      if (data.to_email) formData.append("to_email", data.to_email);
      formData.append("from_email", data.from_email);

      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      // If id exists, update existing draft, otherwise create new draft
      const url = data.id
        ? `${this.baseUrl}emails/${data.id}/update_draft/`
        : `${this.baseUrl}emails/draft/`;

      const method = data.id ? "patch" : "post";

      const response = await axiosInstance[method]<EmailItem>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Failed to save draft:", err.response?.data || err.message);
      throw error;
    }
  }

  async getDrafts(): Promise<EmailItem[]> {
    try {
      const response = await axiosInstance.get<EmailItem[]>(
        `${this.baseUrl}emails/get_drafts/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch drafts:",
        err.response?.data || err.message
      );
      throw error;
    }
  };

  async deleteEmail(id: number): Promise<void> { 
    try {
      await axiosInstance.delete(`${this.baseUrl}emails/${id}/`);
    } catch (error) {
      const err = error as AxiosError;
      console.error("Failed to delete email:", err.response?.data || err.message);
      throw error;
    }
  };
};

export const adminCustomerSupportService = new CustomerSupportService();
