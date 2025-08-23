import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Upload, Trash2 } from "lucide-react";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoUpdate: (url: string | null) => void;
}

export function ProfilePhotoUpload({ currentPhotoUrl, onPhotoUpdate }: ProfilePhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);

    try {
      // Delete existing photo if it exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new photo
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onPhotoUpdate(publicUrl);
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !currentPhotoUrl) return;

    setIsUploading(true);

    try {
      // Delete from storage
      const oldPath = currentPhotoUrl.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${user.id}/${oldPath}`]);
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({ profile_photo_url: null })
        .eq('id', user.id);

      if (error) throw error;

      onPhotoUpdate(null);
      setIsOpen(false);

      toast({
        title: "Sucesso",
        description: "Foto de perfil removida com sucesso.",
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer group">
          <Avatar className="h-12 w-12 border-2 border-border group-hover:border-primary transition-colors">
            <AvatarImage src={currentPhotoUrl || undefined} />
            <AvatarFallback className="bg-muted">
              <Camera className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">Foto de Perfil</p>
            <p className="text-xs text-muted-foreground">
              {currentPhotoUrl ? "Clique para alterar" : "Clique para adicionar"}
            </p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Foto de Perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={previewUrl || currentPhotoUrl || undefined} />
              <AvatarFallback className="bg-muted text-2xl">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2 w-full">
              <Label htmlFor="photo-upload">Selecionar nova foto</Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, WebP. Máximo 5MB.
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium">Arquivo selecionado:</p>
              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {selectedFile && (
              <>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Salvar Foto
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearSelection}>
                  Cancelar
                </Button>
              </>
            )}
            
            {!selectedFile && currentPhotoUrl && (
              <Button
                variant="destructive"
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Foto
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}