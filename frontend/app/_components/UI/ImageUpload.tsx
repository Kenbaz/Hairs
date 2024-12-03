import React, { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { Alert } from "../UI/Alert";


interface ImageUploadProps {
    value?: File[];
    initialPreviews?: string[];
    onChange: (files: File[]) => void;
    onRemove: (index: number) => void;
    maxFiles?: number;
    maxSize?: number;
    className?: string;
}


export function ImageUpload({
  value = [],
  initialPreviews = [],
  onChange,
  onRemove,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = "",
}: ImageUploadProps) {
    const [error, setError] = useState<string | null>(null);
    const [previews, setPreviews] = useState<string[]>(initialPreviews);


    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
            // Handle rejected files
            if (rejectedFiles.length > 0) {
                const errors = rejectedFiles.map((rejection) => {
                    const { errors } = rejection;
                    if (errors[0]?.code === 'file-too-large') {
                        return 'File too large (max 5MB)';
                    }
                    if (errors[0]?.code === 'file-invalid-type') {
                        return 'Only image files are allowed';
                    }
                    return 'Invalid file';
                });
                setError(errors[0]);
                return;
            }

            // Check total files limit
            if (value.length + acceptedFiles.length > maxFiles) {
                setError(`Maximum ${maxFiles} images allowed`);
                return;
            }

            // Clear any previous errors 
            setError(null);

            // Craete preview URLS
            const newPreviews = acceptedFiles.map((file) => URL.createObjectURL(file));

            // Update previews
            setPreviews((prev) => [...prev, ...newPreviews]);

            // Call onChange with new files
            onChange([...value, ...acceptedFiles]);
        },
        [value, maxFiles, onChange]
    );


    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/webp": [".webp"],
      },
      maxSize,
      multiple: true,
    });


    const handleRemove = (index: number) => {
        // Remove preview
        setPreviews((prev) => prev.filter((_, i) => i !== index));

        // Remove file
        onRemove(index);

        // Clear error if under the limit
        if (error && error.includes('Maximum')) {
            setError(null);
        }
    };

    
    return (
      <div className={className}>
        {error && <Alert type="error" message={error} className="mb-4" />}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600">
              Drag & drop images here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum {maxFiles} images, up to {maxSize / (1024 * 1024)}MB each
            </p>
          </div>
        </div>

        {/* Image Previews */}
        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div
                key={preview}
                className="relative group rounded-lg overflow-hidden border border-gray-200"
              >
                <div className="aspect-square relative">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Overlay with delete button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="p-1.5 bg-white rounded-full text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
};