'use client';

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, X, File } from "lucide-react";
import { Alert } from "../UI/Alert";
import { Button } from "../UI/Button";
import Image from "next/image";
import { UploadedFile } from "@/src/types";

// export interface UploadedFile extends File {
//   preview?: string;
//   id?: string;
// }

interface FileUploadProps {
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  onRemove: (fileId: string) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  allowedFileTypes?: string[];
  className?: string;
}


export function FileUpload({
  value = [],
  onChange,
  onRemove,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedFileTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  className = "",
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((rejection) => {
          const { errors, file } = rejection;
          if (errors[0]?.code === "file-too-large") {
            return `${file.name} is too large (max ${
              maxSize / (1024 * 1024)
            }MB)`;
          }
          if (errors[0]?.code === "file-invalid-type") {
            return `${file.name} has an invalid file type`;
          }
          return "Invalid file";
        });
        setError(errors[0]);
        return;
      }

      // Check total files limit
      if (value.length + acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Clear any previous errors
      setError(null);

      // Process accepted files
      const processedFiles: UploadedFile[] = acceptedFiles.map((file) => {
        // Create unique ID for the file
        const id = Math.random().toString(36).substring(2, 9);

        // Create processed file with preview and ID
        const processedFile = Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          id,
        }) as UploadedFile;

        return processedFile;
      });

      // Call onChange with new files
      onChange([...value, ...processedFiles]);
    },
    [value, maxFiles, onChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: allowedFileTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {}
    ),
    multiple: true,
  });

  // Get file icon or preview based on file type
  const getFilePreview = (file: UploadedFile) => {
    if (file?.type && file.type.startsWith("image/") && file.preview) {
      return (
        <div className="h-10 w-10 relative">
          <Image
            src={file.preview}
            alt={file.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            className=" rounded"
          />
        </div>
      );
    }
    return <File className="h-10 w-10 text-gray-400" />;
  };


  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };


  return (
    <div className={className}>
      {error && <Alert type="error" message={error} className="mb-4" />}

      <div
        {...getRootProps()}
        className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }
                `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drop files here, or click to select
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Maximum {maxFiles} files, up to {maxSize / (1024 * 1024)}MB each
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Allowed types:{" "}
          {allowedFileTypes.map((type) => type.split("/")[1]).join(", ")}
        </p>
      </div>

      {/* File List */}
      {value.length > 0 && (
        <ul className="mt-4 space-y-2">
          {value.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                {getFilePreview(file)}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                  }
                  onRemove(file.id || "");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}