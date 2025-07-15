import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, CheckCircle } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number; // in MB
}

export function FileUploader({ 
  onFileSelect, 
  acceptedFormats = ['.csv', '.ofx', '.pdf'],
  maxSize = 20 
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      toast({
        title: "Formato não suportado",
        description: `Por favor, selecione um arquivo ${acceptedFormats.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
    
    toast({
      title: "Arquivo selecionado",
      description: `${file.name} está pronto para upload`,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`relative border-2 border-dashed transition-all duration-200 ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : selectedFile 
              ? "border-success bg-success/5"
              : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          {selectedFile ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Arquivo selecionado</h3>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                  <span>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={removeFile}>
                  <X className="h-4 w-4 mr-2" />
                  Remover
                </Button>
                <Button size="sm" onClick={() => inputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher outro
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  Arraste seu extrato aqui ou clique para selecionar
                </h3>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: {acceptedFormats.join(', ')} (máx. {maxSize}MB)
                </p>
              </div>
              <Button onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Selecionar arquivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}