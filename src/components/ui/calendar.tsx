import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            locale={es}
            showOutsideDays={showOutsideDays}
            className={cn("p-4 bg-white rounded-xl shadow-sm border border-slate-100", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-bold text-slate-900",
                nav: "space-x-1 flex items-center",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-slate-200 transition-all hover:bg-slate-50 absolute left-1"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-slate-200 transition-all hover:bg-slate-50 absolute right-1"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "flex mb-1",
                weekday:
                    "text-slate-400 rounded-md flex-1 font-medium text-[0.7rem] uppercase tracking-tighter text-center py-2 px-0.5",
                week: "flex w-full mt-1",
                day: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-slate-50",
                    props.mode === "range"
                        ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md"
                        : "[&:has([aria-selected])]:rounded-md"
                ),
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary transition-colors"
                ),
                range_start: "day-range-start",
                range_end: "day-range-end",
                selected:
                    "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white font-bold shadow-sm",
                today: "bg-slate-100 text-slate-900 font-bold",
                outside:
                    "day-outside text-slate-400 opacity-30 aria-selected:bg-slate-100/50 aria-selected:text-slate-400 aria-selected:opacity-30",
                disabled: "text-slate-400 opacity-50",
                range_middle:
                    "aria-selected:bg-slate-50 aria-selected:text-slate-900",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
                    return <Icon className="h-4 w-4 text-slate-600" />;
                },
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
