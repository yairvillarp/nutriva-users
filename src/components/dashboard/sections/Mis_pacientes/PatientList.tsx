import type { Patient, PatientPagination } from "@/types/patients";
import { PatientCard } from "./PatientCard";
import { Input } from "@/components/ui/input";
import { Search, Grid, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PatientListProps {
    patients: Patient[];
    pagination?: PatientPagination;
    search: string;
    onSearchChange: (value: string) => void;
    onPageChange: (page: number) => void;
    onHistoryClick?: (patient: Patient) => void;
    onPlanClick?: (patient: Patient) => void;
    gridCols?: string;
}

export function PatientList({
    patients,
    pagination,
    search,
    onSearchChange,
    onPageChange,
    onHistoryClick,
    onPlanClick,
    gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
}: PatientListProps) {
    return (
        <div className="space-y-6">
            <div className="bg-white p-2 rounded-xl shadow-sm flex items-center justify-between gap-4 border border-gray-50">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Busca pacientes por el nombre, la ocupación, el número de identificación o contacto..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-12 h-12 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                    />
                </div>
                <div className="flex items-center space-x-1 pr-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400">
                        <Grid className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400">
                        <ListIcon className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className={`grid gap-4 ${gridCols}`}>
                {patients.map(patient => (
                    <PatientCard
                        key={patient.id}
                        patient={patient}
                        onHistoryClick={() => onHistoryClick?.(patient)}
                        onPlanClick={() => onPlanClick?.(patient)}
                    />
                ))}
            </div>

            {pagination && pagination.total_pages >= 1 && (
                <div className="flex justify-center pt-4">
                    <Pagination>
                        <PaginationContent className="bg-white rounded-lg shadow-sm p-1 border border-gray-50">
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    onClick={() => onPageChange(1)}
                                    disabled={pagination.current_page === 1}
                                    className="cursor-pointer hover:bg-gray-50 text-xs font-medium"
                                >
                                    Primera
                                </Button>
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => onPageChange(Math.max(1, pagination.current_page - 1))}
                                    className={pagination.current_page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-50"}
                                />
                            </PaginationItem>

                            {(() => {
                                const maxVisible = 10;
                                let start = Math.max(1, pagination.current_page - Math.floor(maxVisible / 2));
                                let end = Math.min(pagination.total_pages, start + maxVisible - 1);

                                if (end === pagination.total_pages) {
                                    start = Math.max(1, end - maxVisible + 1);
                                }

                                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                                    <PaginationItem key={p}>
                                        <PaginationLink
                                            isActive={p === pagination.current_page}
                                            onClick={() => onPageChange(p)}
                                            className={`cursor-pointer ${p === pagination.current_page ? "bg-primary text-white hover:bg-primary" : "hover:bg-gray-50"}`}
                                        >
                                            {p}
                                        </PaginationLink>
                                    </PaginationItem>
                                ));
                            })()}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => onPageChange(Math.min(pagination.total_pages, pagination.current_page + 1))}
                                    className={pagination.current_page === pagination.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-50"}
                                />
                            </PaginationItem>

                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    onClick={() => onPageChange(pagination.total_pages)}
                                    disabled={pagination.current_page === pagination.total_pages}
                                    className="cursor-pointer hover:bg-gray-50 text-xs font-medium"
                                >
                                    Última
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
