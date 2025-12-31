"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import { useState, useRef } from "react";

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function PDFUploader({
  onFileSelect,
  isProcessing,
}: PDFUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type === "application/pdf") {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert("Por favor, selecione apenas arquivos PDF");
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 bg-white"
            }
            ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={handleChange}
            className="hidden"
            disabled={isProcessing}
          />

          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />

          <p className="text-lg font-medium text-gray-700 mb-2">
            Arraste o PDF da fatura aqui
          </p>
          <p className="text-sm text-gray-500">
            ou clique para selecionar o arquivo
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Apenas arquivos PDF da Copel
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={handleRemove}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Remover arquivo"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
