import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Apple, Plus } from "lucide-react";
import { foodRecipeService, type Food } from "@/services/foodRecipeService";
import { cn } from "@/lib/utils";

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (food: Food, grams: number) => void;
    mealTitle: string;
}

export function FoodSearchModal({ isOpen, onClose, onAdd, mealTitle }: FoodSearchModalProps) {
    const [search, setSearch] = useState("");
    const [foods, setFoods] = useState<Food[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [grams, setGrams] = useState<number>(100);

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            setFoods([]);
            setSelectedFood(null);
            setGrams(100);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!search.trim()) return;
        setIsLoading(true);
        try {
            const data = await foodRecipeService.searchFoods(search);
            setFoods(data.data || []);
        } catch (error) {
            console.error("Error searching foods:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        if (selectedFood) {
            onAdd(selectedFood, grams);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Agregar Alimento a {mealTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Buscar alimento (ej: Manzana, Pollo...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {foods.length > 0 ? (
                            foods.map((food) => (
                                <div
                                    key={food.id}
                                    onClick={() => setSelectedFood(food)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                        selectedFood?.id === food.id
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-gray-100 hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                            <Apple className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{food.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                {food.kcals} kcal • {food.cho}g C • {food.protein}g P • {food.lip}g G (por 100g)
                                            </p>
                                        </div>
                                    </div>
                                    {selectedFood?.id === food.id && (
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

                    {selectedFood && (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Cantidad (gramos)</label>
                                <Input
                                    type="number"
                                    value={grams}
                                    onChange={(e) => setGrams(Number(e.target.value))}
                                    className="w-24 text-right font-bold"
                                />
                            </div>
                            <div className="flex justify-between text-xs font-bold pt-2 border-t border-gray-200">
                                <span className="text-gray-400">Total estimado:</span>
                                <span className="text-primary">
                                    {Math.round((parseFloat(selectedFood.kcals as string) * grams) / 100)} kcal
                                </span>
                            </div>
                            <Button className="w-full mt-2 font-bold" onClick={handleAdd}>
                                Agregar {selectedFood.name}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
