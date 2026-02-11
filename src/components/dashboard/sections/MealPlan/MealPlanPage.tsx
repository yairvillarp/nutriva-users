import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mealPlanService, type MealPlanSummary } from "@/services/patients/mealPlanService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, Target, CalendarDays, Activity, PieChart, ChevronDown, ChevronRight, Apple, Zap, Loader2, Trash2 } from "lucide-react";
import { FoodSearchModal } from "./modals/FoodSearchModal";
import { RecipeSearchModal } from "./modals/RecipeSearchModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { patientsService } from "@/services/patients/services";
import type { Patient } from "@/types/patients";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function MealPlanPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [summary, setSummary] = useState<MealPlanSummary | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [date, setDate] = useState<Date>(new Date());
    const [datesWithData, setDatesWithData] = useState<string[]>([]);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [foodModal, setFoodModal] = useState<{ isOpen: boolean, mealKey: string, mealTitle: string }>({ isOpen: false, mealKey: "", mealTitle: "" });
    const [recipeModal, setRecipeModal] = useState<{ isOpen: boolean, mealKey: string, mealTitle: string }>({ isOpen: false, mealKey: "", mealTitle: "" });

    useEffect(() => {
        const fetchDates = async () => {
            if (!id) return;
            try {
                const dates = await mealPlanService.getDatesWithData(id);
                setDatesWithData(dates);
            } catch (error) {
                console.error("Error fetching dates with data:", error);
            }
        };
        fetchDates();
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsUpdating(true);
            try {
                const [summaryData, patientData] = await Promise.all([
                    mealPlanService.getSummary(id, format(date, "yyyy-MM-dd")),
                    patientsService.getPatient(id)
                ]);
                setSummary(summaryData);
                setPatient(patientData);
            } catch (error) {
                console.error("Error fetching meal plan data:", error);
            } finally {
                setLoading(false);
                setIsUpdating(false);
            }
        };

        fetchData();
    }, [id, date]);

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    const targetKcal = summary?.userObjective?.calorias || 0;
    const currentKcal = summary?.dailyIntake?.algo?.kcal?.total || 0;
    const kcalPercent = targetKcal > 0 ? Math.min((currentKcal / targetKcal) * 100, 100) : 0;

    const targetProte = summary?.userObjective?.rango?.prote || 20;
    const targetCarb = summary?.userObjective?.rango?.carb || 50;
    const targetFat = summary?.userObjective?.rango?.fats || 30;

    const currentProte = summary?.dailyIntake?.algo?.proteinas?.total || 0;
    const currentCarb = summary?.dailyIntake?.algo?.carbs?.total || 0;
    const currentFat = summary?.dailyIntake?.algo?.grasas?.total || 0;

    const meals = [
        { title: "Desayuno", key: 'breakfast', data: summary?.dailyIntake?.breakfastEnriched || [] },
        { title: "Almuerzo", key: 'lunch', data: summary?.dailyIntake?.lunchEnriched || [] },
        { title: "Merienda", key: 'snack', data: summary?.dailyIntake?.snackEnriched || [] },
        { title: "Cena", key: 'dinner', data: summary?.dailyIntake?.dinnerEnriched || [] },
    ];

    const calculateMealTotals = (mealData: any[]) => {
        return mealData.reduce((acc, item) => {
            const isPremade = !!item.recipeDetail;
            const foodOrRecipe = isPremade ? item.recipeDetail : (item.foodDetail || item.food || item);
            
            const getVal = (key: 'cho' | 'protein' | 'lip' | 'kcals') => {
                const val = item[key] ?? foodOrRecipe[key] ?? 0;
                const base = parseFloat(val);
                return isPremade ? base * (item.units || 1) : (base * (item.grams || 0)) / 100;
            };

            acc.kcal += getVal('kcals');
            acc.cho += getVal('cho');
            acc.pro += getVal('protein');
            acc.lip += getVal('lip');
            return acc;
        }, { kcal: 0, cho: 0, pro: 0, lip: 0 });
    };

    const handleAddFood = async (food: any, grams: number) => {
        if (!id) return;
        setIsUpdating(true);
        try {
            await mealPlanService.addFood({
                type: foodModal.mealKey,
                product: { 
                    ...food,
                    foodId: food.id,
                    food: food,
                    grams: grams,
                    units: grams,
                    unitsName: 'g'
                },
                userId: id,
                date: format(date, "yyyy-MM-dd")
            });
            const summaryData = await mealPlanService.getSummary(id, format(date, "yyyy-MM-dd"));
            setSummary(summaryData);
        } catch (error) {
            console.error("Error adding food:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddRecipe = async (recipe: any, units: number) => {
        if (!id) return;
        setIsUpdating(true);
        try {
            await mealPlanService.addRecipe({
                type: recipeModal.mealKey,
                recipeId: recipe.id,
                unit: units,
                userId: id,
                date: format(date, "yyyy-MM-dd")
            });
            const summaryData = await mealPlanService.getSummary(id, format(date, "yyyy-MM-dd"));
            setSummary(summaryData);
        } catch (error) {
            console.error("Error adding recipe:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveItem = async (mealKey: string, item: any) => {
        if (!id) return;
        setIsUpdating(true);
        try {
            if (item.recipeDetail) {
                await mealPlanService.deleteRecipe({
                    type: mealKey,
                    recipeId: item.recipeId || item.recipe?.id || item.recipeDetail.id,
                    userId: id,
                    date: format(date, "yyyy-MM-dd")
                });
            } else {
                await mealPlanService.removeFood({
                    type: mealKey,
                    product: item,
                    userId: id,
                    date: format(date, "yyyy-MM-dd")
                });
            }
            // Refresh data
            const summaryData = await mealPlanService.getSummary(id, format(date, "yyyy-MM-dd"));
            setSummary(summaryData);
        } catch (error) {
            console.error("Error removing item:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/10">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Plan de alimentación</h1>
                    <p className="text-gray-500">
                        {patient ? `${patient.first_name} ${patient.last_name}` : "Cargando..."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                            <Target className="h-4 w-4 text-primary" />
                            Objetivo del Paciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold text-gray-900">
                            {summary?.patientObjective || "No definido"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            Primera Consulta
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold text-gray-900">
                            {summary?.consultationDates.first ? format(new Date(summary.consultationDates.first), "dd/MM/yyyy") : "N/A"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            Última Consulta
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold text-gray-900">
                            {summary?.consultationDates.last ? format(new Date(summary.consultationDates.last), "dd/MM/yyyy") : "N/A"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">Resumen Nutricional</h2>
                <div className="relative w-full sm:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full sm:w-[280px] justify-start text-left font-bold bg-white border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all shadow-sm rounded-xl h-12 px-4 group",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <div className="p-2 rounded-lg bg-primary/10 mr-3 group-hover:bg-primary/20 transition-colors">
                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                </div>
                                {date ? format(date, "PPPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                    if (newDate) setDate(newDate);
                                }}
                                initialFocus
                                modifiers={{
                                    hasData: (day) => {
                                        const dayStr = format(day, "yyyy-MM-dd");
                                        return datesWithData.includes(dayStr);
                                    }
                                }}
                                modifiersClassNames={{
                                    hasData: "day-has-data"
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Activity className="h-5 w-5" />
                            Meta Calórica
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-5xl font-extrabold text-[#344054] tracking-tight">{Math.round(currentKcal)}</span>
                                <span className="text-gray-400 font-medium ml-2 text-lg">/ {targetKcal} kcal</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                                    {Math.round(kcalPercent)}% completado
                                </span>
                            </div>
                        </div>
                        <Progress value={kcalPercent} className="h-4 bg-gray-100 [&>div]:bg-primary" />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-slate-700">
                            <PieChart className="h-5 w-5" />
                            Distribución de Macronutrientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold uppercase tracking-wide text-gray-500">
                                    <span className="flex items-center gap-2 text-blue-600">
                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                        Carbohidratos ({targetCarb}%)
                                    </span>
                                    <span>{Math.round(currentCarb)}g</span>
                                </div>
                                <Progress value={targetCarb} className="h-2 bg-blue-50 [&>div]:bg-blue-500" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold uppercase tracking-wide text-gray-500">
                                    <span className="flex items-center gap-2 text-rose-600">
                                        <div className="w-2 h-2 rounded-full bg-rose-600" />
                                        Proteínas ({targetProte}%)
                                    </span>
                                    <span>{Math.round(currentProte)}g</span>
                                </div>
                                <Progress value={targetProte} className="h-2 bg-rose-50 [&>div]:bg-rose-500" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold uppercase tracking-wide text-gray-500">
                                    <span className="flex items-center gap-2 text-amber-600">
                                        <div className="w-2 h-2 rounded-full bg-amber-600" />
                                        Grasas ({targetFat}%)
                                    </span>
                                    <span>{Math.round(currentFat)}g</span>
                                </div>
                                <Progress value={targetFat} className="h-2 bg-amber-50 [&>div]:bg-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6 pt-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Detalle de Comidas
                </h2>

                <div className="grid grid-cols-1 gap-6">
                    {meals.map((meal, idx) => {
                        const mealTotals = calculateMealTotals(meal.data);
                        return (
                            <Card key={idx} className="border-none shadow-sm overflow-hidden bg-white">
                                <CardHeader className="bg-gray-50/50 py-4 border-b border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-lg font-bold text-gray-700">{meal.title}</CardTitle>
                                            <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20">
                                                {meal.data.length} {meal.data.length === 1 ? "alimento" : "alimentos"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold">
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-400 uppercase text-[9px] tracking-widest">Calorías</span>
                                                <span className="text-primary text-sm">{Math.round(mealTotals.kcal)} kcal</span>
                                            </div>
                                            <div className="w-px h-8 bg-gray-200 hidden md:block" />
                                            <div className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-blue-500 uppercase text-[9px] tracking-widest">Carbs</span>
                                                    <span className="text-gray-700">{Math.round(mealTotals.cho)}g</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-rose-500 uppercase text-[9px] tracking-widest">Prote</span>
                                                    <span className="text-gray-700">{Math.round(mealTotals.pro)}g</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-amber-500 uppercase text-[9px] tracking-widest">Grasas</span>
                                                    <span className="text-gray-700">{Math.round(mealTotals.lip)}g</span>
                                                </div>
                                            </div>
                                            <div className="ml-2 flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-8 text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary hover:bg-primary/5"
                                                    onClick={() => setFoodModal({ isOpen: true, mealKey: meal.key, mealTitle: meal.title })}
                                                >
                                                    + Alimento
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-8 text-[10px] font-bold uppercase tracking-wider border-purple-200 text-purple-600 hover:bg-purple-50"
                                                    onClick={() => setRecipeModal({ isOpen: true, mealKey: meal.key, mealTitle: meal.title })}
                                                >
                                                    + Receta
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 relative">
                                    {isUpdating && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center transition-all">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Actualizando...</p>
                                            </div>
                                        </div>
                                    )}
                                    {meal.data.length > 0 ? (
                                        <div className="divide-y divide-gray-50">
                                            {meal.data.map((item: any, itemIdx: number) => {
                                                const isPremade = !!item.recipeDetail;
                                                const isChecked = item.checked === true;
                                                const itemId = `${idx}-${itemIdx}`;
                                                const expanded = expandedItems[itemId];
                                                const foodOrRecipe = isPremade ? item.recipeDetail : (item.foodDetail || item.food || item);

                                                return (
                                                    <div key={itemIdx} className={cn(
                                                        "p-5 space-y-4 border-b border-gray-100 last:border-0 transition-all duration-300",
                                                        isChecked 
                                                            ? "bg-emerald-50/40 border-l-4 border-l-emerald-500 shadow-sm" 
                                                            : "bg-white hover:bg-gray-50/50"
                                                    )}>
                                                        {(() => {
                                                            const getMacroValue = (macroKey: 'cho' | 'protein' | 'lip' | 'kcals') => {
                                                                const val = item[macroKey] ?? foodOrRecipe[macroKey] ?? 0;
                                                                const baseValue = parseFloat(val);
                                                                if (isPremade) {
                                                                    return baseValue * (item.units || 1);
                                                                } else {
                                                                    if (item[macroKey] !== undefined && item[macroKey] !== null) return baseValue;
                                                                    return (baseValue * (item.grams || 0)) / 100;
                                                                }
                                                            };

                                                            const kcalVal = getMacroValue('kcals');
                                                            const choVal = getMacroValue('cho');
                                                            const proVal = getMacroValue('protein');
                                                            const lipVal = getMacroValue('lip');

                                                            return (
                                                                <>
                                                                    <div className="flex items-start justify-between group/item">
                                                                        <div
                                                                            className="flex gap-4 cursor-pointer flex-1"
                                                                            onClick={() => toggleExpand(itemId)}
                                                                        >
                                                                            <div className={cn(
                                                                                "p-3 rounded-2xl transition-all duration-300 shadow-sm",
                                                                                isPremade
                                                                                    ? "bg-purple-100 text-purple-700 group-hover:bg-purple-200"
                                                                                    : "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200",
                                                                                isChecked && "bg-emerald-500 text-white shadow-emerald-200"
                                                                            )}>
                                                                                <Apple className="h-5 w-5" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <h4 className={cn(
                                                                                        "font-black text-gray-900 text-base tracking-tight",
                                                                                        isChecked && "text-emerald-900"
                                                                                    )}>
                                                                                        {isPremade ? item.recipeDetail.name : (item.foodDetail?.name || item.name || item.food?.name)}
                                                                                    </h4>
                                                                                    {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                                                                                    {isChecked ? (
                                                                                        <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                                                                            <Zap className="h-3 w-3" /> Contabilizado
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-gray-200">
                                                                                            No chequeado
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-sm text-gray-400 font-bold">
                                                                                    {item.units} {item.unitsName || "unidades"} • {Math.round(item.grams || 0)}g
                                                                                    {isPremade && <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] uppercase font-black tracking-widest">Receta</span>}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-start gap-4">
                                                                            <div className="text-right">
                                                                                <p className={cn(
                                                                                    "text-2xl font-black tracking-tighter leading-none",
                                                                                    isChecked ? "text-emerald-600" : "text-gray-900"
                                                                                )}>
                                                                                    {Math.round(kcalVal)} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">kcal</span>
                                                                                </p>
                                                                                <div className="flex gap-2 mt-2 justify-end">
                                                                                    <span className="text-[12px] bg-blue-100/50 text-blue-700 px-2 py-1 rounded-md font-black border border-blue-200/50 shadow-sm">C: {Math.round(choVal)}g</span>
                                                                                    <span className="text-[12px] bg-rose-100/50 text-rose-700 px-2 py-1 rounded-md font-black border border-rose-200/50 shadow-sm">P: {Math.round(proVal)}g</span>
                                                                                    <span className="text-[12px] bg-amber-100/50 text-amber-700 px-2 py-1 rounded-md font-black border border-amber-200/50 shadow-sm">G: {Math.round(lipVal)}g</span>
                                                                                </div>
                                                                            </div>
                                                                            <Button 
                                                                                variant="ghost" 
                                                                                size="icon" 
                                                                                className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover/item:opacity-100"
                                                                                onClick={() => handleRemoveItem(meal.key, item)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {expanded && (
                                                                        <div className="pl-11 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                                            {/* Información Nutricional Detallada */}
                                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Sodio</p>
                                                                                    <p className="text-xs font-bold text-gray-700">{foodOrRecipe.sodium || 0} mg</p>
                                                                                </div>
                                                                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Fibra</p>
                                                                                    <p className="text-xs font-bold text-gray-700">{foodOrRecipe.fiber || 0} g</p>
                                                                                </div>
                                                                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Grasas Sat.</p>
                                                                                    <p className="text-xs font-bold text-gray-700">{foodOrRecipe.saturated_fat || 0} g</p>
                                                                                </div>
                                                                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Grasas Mono.</p>
                                                                                    <p className="text-xs font-bold text-gray-700">{foodOrRecipe.mono_unsaturated_fat || 0} g</p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Detalles de la Receta */}
                                                                            {isPremade && (
                                                                                <div className="space-y-3">
                                                                                    {item.components && item.components.length > 0 && (
                                                                                        <div className="space-y-2">
                                                                                            <p className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                                                                                                <PieChart className="h-3 w-3" />
                                                                                                Componentes de la Receta
                                                                                            </p>
                                                                                            <div className="bg-purple-50/30 p-3 rounded-xl border border-purple-100/50 space-y-2">
                                                                                                {item.components.map((comp: any, cidx: number) => {
                                                                                                    const cGrams = comp.grams || 0;
                                                                                                    const cFood = comp.food || {};
                                                                                                    const cCho = (parseFloat(cFood.cho || 0) * cGrams) / 100;
                                                                                                    const cPro = (parseFloat(cFood.protein || 0) * cGrams) / 100;
                                                                                                    const cLip = (parseFloat(cFood.lip || 0) * cGrams) / 100;

                                                                                                    return (
                                                                                                        <div key={cidx} className="flex justify-between items-center text-[11px] border-b border-purple-100/30 last:border-0 pb-1 last:pb-0">
                                                                                                            <span className="font-medium text-gray-600 truncate mr-2">
                                                                                                                {cFood.name} ({cGrams}g)
                                                                                                            </span>
                                                                                                            <div className="flex gap-2 shrink-0">
                                                                                                                <span className="text-blue-600 font-bold">{Math.round(cCho)}g C</span>
                                                                                                                <span className="text-rose-600 font-bold">{Math.round(cPro)}g P</span>
                                                                                                                <span className="text-amber-600 font-bold">{Math.round(cLip)}g G</span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {foodOrRecipe.steps && foodOrRecipe.steps.length > 0 && (
                                                                                        <div className="space-y-2">
                                                                                            <p className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                                                                                                <Activity className="h-3 w-3" />
                                                                                                Pasos de Preparación
                                                                                            </p>
                                                                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                                                <ul className="space-y-2">
                                                                                                    {foodOrRecipe.steps.map((step: string, sidx: number) => (
                                                                                                        <li key={sidx} className="text-[11px] text-gray-600 flex gap-2">
                                                                                                            <span className="font-bold text-primary shrink-0">{sidx + 1}.</span>
                                                                                                            <span>{step}</span>
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-gray-50/20">
                                            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest italic">Sin registros</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <FoodSearchModal 
                isOpen={foodModal.isOpen} 
                onClose={() => setFoodModal({ ...foodModal, isOpen: false })} 
                onAdd={handleAddFood} 
                mealTitle={foodModal.mealTitle} 
            />
            <RecipeSearchModal 
                isOpen={recipeModal.isOpen} 
                onClose={() => setRecipeModal({ ...recipeModal, isOpen: false })} 
                onAdd={handleAddRecipe} 
                mealTitle={recipeModal.mealTitle} 
                patientId={id}
            />
        </div>
    );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-medium border",
            variant === "outline" ? "bg-transparent" : "bg-primary/10 text-primary border-primary/20",
            className
        )}>
            {children}
        </span>
    );
}
