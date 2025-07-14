import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConciliacao } from "@/hooks/useConciliacao";
import { Plus, Tag } from "lucide-react";

export function CategoryManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const { userCategories, createUserCategory, isLoading } = useConciliacao();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const success = await createUserCategory(newCategoryName.trim(), newCategoryColor);
    if (success) {
      setNewCategoryName("");
      setNewCategoryColor("#3B82F6");
      setIsOpen(false);
    }
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
              <DialogTitle>Criar Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Nome da Categoria</Label>
                <Input
                  id="categoryName"
                  placeholder="Ex: Marketing Digital"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
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
                  onClick={handleCreateCategory} 
                  disabled={!newCategoryName.trim() || isLoading}
                  className="flex-1"
                >
                  Criar Categoria
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {userCategories.length > 0 && (
        <div className="space-y-2">
          {userCategories.map((category) => (
            <div 
              key={category.id} 
              className="flex items-center gap-2 p-2 bg-card rounded-lg border"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.cor || "#3B82F6" }}
              />
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{category.nome_categoria}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}