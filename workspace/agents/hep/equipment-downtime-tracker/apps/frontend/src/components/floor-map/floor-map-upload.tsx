"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Image as ImageIcon, X, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FloorMapUploadProps {
  onUpload: (file: File) => Promise<void>;
  currentMapUrl?: string;
  onRemove?: () => void;
  className?: string;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FloorMapUpload({
  onUpload,
  currentMapUrl,
  onRemove,
  className,
}: FloorMapUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentMapUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a PNG, JPG, or SVG file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB.";
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onUpload(file);
      setUploadProgress(100);
    } catch (err) {
      setError("Failed to upload floor map. Please try again.");
      setPreviewUrl(currentMapUrl || null);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    onRemove?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {previewUrl ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Floor Map Preview"
                className="w-full h-48 object-contain bg-muted"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClick}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {isUploading && (
              <div className="p-4 space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              {isUploading ? (
                <div className="animate-spin">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {isUploading ? (
              <div className="space-y-2 w-full max-w-xs">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            ) : (
              <>
                <p className="text-lg font-medium mb-1">
                  Drop floor map here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <Button variant="secondary" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              Supports PNG, JPG, SVG • Max 10MB
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
