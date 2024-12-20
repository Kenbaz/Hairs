import { Trash2 } from "lucide-react";
import { Button } from "../../UI/Button";
import { ConfirmModal } from "../../UI/ConfirmModal";
import { adminProductService } from "@/src/libs/services/adminProductService";
import { Alert } from "../../UI/Alert";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";


interface ProductBulkActionProps { 
    selectedIds: number[];
    onClearSelection: () => void;
    queryKey: unknown[];
}


export function ProductBulkActions({ selectedIds, onClearSelection, queryKey }: ProductBulkActionProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alert, setAlert] = useState<{
            type: 'success' | 'error';
            message: string;
        } | null>(null);
        
    const queryClient = useQueryClient();


    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        setIsDeleting(true);
        try {
            const response = await adminProductService.bulkDeleteProducts(selectedIds)
            showAlert('success', `${response.message}`);
            onClearSelection();

            // Invalidate the products query to refetch the data
            queryClient.invalidateQueries({ queryKey: queryKey });
        } catch (error) {
            showAlert('error', `Failed to delete products. Please try again.`);
            console.error(error);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };


    if (selectedIds.length === 0) return null;


    const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 5000);
    };


    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-10">
        {alert && (
          <Alert type={alert.type} message={alert.message} className="mb-4" />
        )}
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedIds.length} {selectedIds.length === 1 ? "item" : "items"}{" "}
            selected
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onClearSelection}>
              Cancel Selection
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              isLoading={isDeleting}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
          title="Delete Selected Products"
          message={`Are you sure you want to delete ${
            selectedIds.length
          } selected ${
            selectedIds.length === 1 ? "product" : "products"
          }? This action cannot be undone.`}
          confirmText="Delete Products"
          variant="danger"
        />
      </div>
    );
}