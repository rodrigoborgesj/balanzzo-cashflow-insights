import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { validateFileUpload, sanitizeInput } from "@/utils/security";

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
    // Enhanced security validation using security utils
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      toast({
        title: "Arquivo rejeitado",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Sanitize filename for security
    const sanitizedName = sanitizeInput(file.name);
    if (sanitizedName !== file.name) {
      toast({
        title: "Nome do arquivo foi ajustado",
        description: "Caracteres potencialmente perigosos foram removidos do nome do arquivo",
        variant: "default",
      });
    }

    // Additional file extension validation
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      toast({
        title: "Formato não suportado",
        description: `Por favor, selecione um arquivo ${acceptedFormats.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (using security utils validation as primary)
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
      title: "Arquivo selecionado com segurança",
      description: `${sanitizedName} passou na validação de segurança`,
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
        <CardContent className="p-4">
          {selectedFile ? (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-foreground text-sm">Arquivo selecionado</h3>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{selectedFile.name}</span>
                </div>
              </div>
              <div className="flex gap-1 justify-center">
                <Button variant="outline" size="sm" onClick={removeFile} className="h-7 px-2 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Remover
                </Button>
                <Button size="sm" onClick={() => inputRef.current?.click()} className="h-7 px-2 text-xs">
                  <Upload className="h-3 w-3 mr-1" />
                  Outro
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-foreground text-sm">
                  Clique para selecionar
                </h3>
              </div>
              <Button onClick={() => inputRef.current?.click()} size="sm" className="h-7 px-3 text-xs">
                <Upload className="h-3 w-3 mr-1" />
                Selecionar
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