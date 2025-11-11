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

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <Card 
      className={`relative border-2 border-dashed transition-all duration-300 cursor-pointer rounded-xl overflow-hidden ${
        dragActive 
          ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 scale-[1.02] shadow-lg' 
          : 'border-border hover:border-primary/50 hover:shadow-md'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={openFileDialog}
    >
      <CardContent className="p-8 text-center">
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-2 bg-success/10 rounded-full">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-success">Arquivo carregado</p>
                <p className="text-sm text-muted-foreground">Pronto para processar</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-muted/50 to-muted p-4 rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.toUpperCase().split('.').pop()}
                        </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }} 
                className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
              >
                Remover
              </Button>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }} 
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
              >
                Escolher outro
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8">
              <div className="flex items-center space-x-6">
                <div className={`p-4 rounded-full transition-all duration-300 ${
                  dragActive 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-white scale-110' 
                    : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground'
                }`}>
                  <Upload className="h-12 w-12" />
                </div>
                <div className="space-y-2 text-left">
                  <h3 className="font-semibold text-xl text-foreground">
                    {dragActive ? 'Solte seu arquivo aqui' : 'Upload do Extrato'}
                  </h3>
                  <p className="text-muted-foreground">
                    Arraste e solte seu arquivo CSV/OFX ou clique para selecionar
                  </p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>{acceptedFormats.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Máx: {maxSize}MB</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Escolher arquivo
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
        />
      </CardContent>
    </Card>
  );
}