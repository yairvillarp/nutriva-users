import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Utensils, Plus } from "lucide-react";
import { foodRecipeService, type Recipe } from "@/services/foodRecipeService";
import { cn } from "@/lib/utils";

interface RecipeSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (recipe: Recipe, units: number) => void;
    mealTitle: string;
    patientId?: string;
}

export function RecipeSearchModal({ isOpen, onClose, onAdd, mealTitle, patientId }: RecipeSearchModalProps) {
    const [search, setSearch] = useState("");
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [units, setUnits] = useState<number>(1);

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            setRecipes([]);
            setSelectedRecipe(null);
            setUnits(1);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!search.trim()) return;
        setIsLoading(true);
        try {
            const data = await foodRecipeService.searchRecipes(search, patientId);
            setRecipes(data.result || []); // Adjusting to 'result' based on controller response structure
        } catch (error) {
            console.error("Error searching recipes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        if (selectedRecipe) {
            onAdd(selectedRecipe, units);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Agregar Receta a {mealTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Buscar receta (ej: Ensalada César, Omelette...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {recipes.length > 0 ? (
                            recipes.map((recipe) => (
                                <div
                                    key={recipe.id}
                                    onClick={() => setSelectedRecipe(recipe)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                        selectedRecipe?.id === recipe.id
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-gray-100 hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                            <Utensils className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{recipe.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                {recipe.kcals} kcal • {recipe.cho}g C • {recipe.protein}g P • {recipe.lip}g G (por porción)
                                            </p>
                                        </div>
                                    </div>
                                    {selectedRecipe?.id === recipe.id && (
                                        <div className="bg-primary text-white p-1 rounded-full">
                                            <Plus className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            !isLoading && search && (
                                <p className="text-center text-gray-400 py-8 text-sm italic">No se encontraron resultados</p>
                            )
                        )}
                    </div>

                    {selectedRecipe && (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Cantidad (porciones)</label>
                                <Input
                                    type="number"
                                    value={units}
                                    onChange={(e) => setUnits(Number(e.target.value))}
                                    className="w-24 text-right font-bold"
                                />
                            </div>
                            <div className="flex justify-between text-xs font-bold pt-2 border-t border-gray-200">
                                <span className="text-gray-400">Total estimado:</span>
                                <span className="text-primary">
                                    {Math.round((parseFloat(selectedRecipe.kcals as string) * units))} kcal
                                </span>
                            </div>
                            <Button className="w-full mt-2 font-bold" onClick={handleAdd}>
                                Agregar {selectedRecipe.name}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
