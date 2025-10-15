import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useConciliacao } from "@/hooks/useConciliacao";
import { Plus, Tag, Edit2, Trash2 } from "lucide-react";

export function CategoryManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [duplicateError, setDuplicateError] = useState<string>("");
  const { 
    userCategories, 
    createUserCategory, 
    updateUserCategory, 
    deleteUserCategory, 
    checkCategoryUsage,
    isLoading,
    loadUserCategories
  } = useConciliacao();

  // Load categories when component mounts and ensure they're always visible
  useEffect(() => {
    loadUserCategories();
  }, [loadUserCategories]);

  // Ensure categories are loaded on component mount
  useEffect(() => {
    if (userCategories.length === 0) {
      loadUserCategories();
    }
  }, [userCategories.length, loadUserCategories]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    // Check for duplicates
    const isDuplicate = userCategories.some(cat => 
      cat.nome_categoria.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setDuplicateError("Esta categoria já existe!");
      return;
    }

    const success = await createUserCategory(newCategoryName.trim(), newCategoryColor);
    if (success) {
      resetForm();
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    // Check for duplicates (excluding current category)
    const isDuplicate = userCategories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.nome_categoria.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setDuplicateError("Esta categoria já existe!");
      return;
    }

    const success = await updateUserCategory(editingCategory.id, newCategoryName.trim(), newCategoryColor);
    if (success) {
      resetForm();
    }
  };

  const handleDeleteCategory = async (category: any) => {
    const usage = await checkCategoryUsage(category.nome_categoria);
    if (usage.inUse) {
      return; // Error message is shown in the hook
    }

    const success = await deleteUserCategory(category.id, category.nome_categoria);
    if (success) {
      // Reload categories to update UI immediately
      await loadUserCategories();
    }
  };

  const openEditDialog = (category: any) => {
    setEditingCategory(category);
    setNewCategoryName(category.nome_categoria);
    setNewCategoryColor(category.cor || "#3B82F6");
    setIsOpen(true);
  };

  const resetForm = () => {
    setNewCategoryName("");
    setNewCategoryColor("#3B82F6");
    setEditingCategory(null);
    setDuplicateError("");
    setIsOpen(false);
  };

  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green  
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#F97316", // Orange
    "#06B6D4", // Cyan
    "#84CC16", // Lime
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Categorias Personalizadas</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Criar Nova Categoria"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Nome da Categoria</Label>
                <Input
                  id="categoryName"
                  placeholder="Ex: Marketing Digital"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setDuplicateError("");
                  }}
                />
                {duplicateError && (
                  <p className="text-sm text-destructive">{duplicateError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Cor da Categoria</Label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCategoryColor === color ? "border-foreground" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategoryColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingCategory ? handleEditCategory : handleCreateCategory} 
                  disabled={!newCategoryName.trim() || isLoading}
                  className="flex-1"
                >
                  {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Categorias Existentes ({userCategories.length})
        </div>
        {userCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma categoria personalizada criada</p>
            <p className="text-xs mt-1">Crie sua primeira categoria acima</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {userCategories.map((category) => (
              <div 
                key={category.id} 
                className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:border-primary/20 transition-colors group"
              >
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: category.cor || "#3B82F6" }}
                />
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm flex-1 font-medium">{category.nome_categoria}</span>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={() => openEditDialog(category)}
                    title="Editar categoria"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Excluir categoria"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a categoria "<strong>{category.nome_categoria}</strong>"? 
                          <br />
                          <br />
                          Se esta categoria estiver sendo usada em transações, ela será removida das transações e elas ficarão sem categoria definida.
                          <br />
                          <br />
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCategory(category)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}