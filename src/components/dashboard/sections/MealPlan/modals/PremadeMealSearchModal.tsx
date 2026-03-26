import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Utensils, Plus } from "lucide-react";
import { premadeFoodService, type PremadeMeal } from "@/services/premadeFoodService";
import { cn } from "@/lib/utils";

interface PremadeMealSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (premadeMeal: PremadeMeal, units: number) => void;
    mealTitle: string;
}

export function PremadeMealSearchModal({ isOpen, onClose, onAdd, mealTitle }: PremadeMealSearchModalProps) {
    const [search, setSearch] = useState("");
    const [premades, setPremades] = useState<PremadeMeal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPremade, setSelectedPremade] = useState<PremadeMeal | null>(null);
    const [units, setUnits] = useState<number>(1);

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            setPremades([]);
            setSelectedPremade(null);
            setUnits(1);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const data = await premadeFoodService.searchPremadeMeals(search);
            setPremades(data.data || []); 
        } catch (error) {
            console.error("Error searching premade meals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        if (selectedPremade) {
            onAdd(selectedPremade, units);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Agregar Comida Pre-hecha a {mealTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Buscar comida pre-hecha..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {premades.length > 0 ? (
                            premades.map((premade) => (
                                <div
                                    key={premade.id}
                                    onClick={() => setSelectedPremade(premade)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                        selectedPremade?.id === premade.id
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-gray-100 hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                            <Utensils className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{premade.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                                                {premade.kcalsFrom} - {premade.kcalsTo} Kcals
                                            </p>
                                        </div>
                                    </div>
                                    {selectedPremade?.id === premade.id && (
                                        <div className="bg-primary text-white p-1 rounded-full">
                                            <Plus className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            !isLoading && (
                                <p className="text-center text-gray-400 py-8 text-sm italic">
                                    {search ? "No se encontraron resultados" : "Busca para ver opciones"}
                                </p>
                            )
                        )}
                    </div>

                    {selectedPremade && (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Cantidad (multiplicador)</label>
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
                                    {Math.round((parseFloat(selectedPremade.kcalsFrom as string) * units))} - {Math.round((parseFloat(selectedPremade.kcalsTo as string) * units))} Kcals
                                </span>
                            </div>
                            <Button className="w-full mt-2 font-bold" onClick={handleAdd}>
                                Agregar {selectedPremade.name}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
