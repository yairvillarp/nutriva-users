import { useQuery } from "@tanstack/react-query";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import { useState, useEffect } from "react";

export const useMyPatients = (initialItemsPerPage: number = 10) => {
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState<Record<string, any>>({});

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search change
        }, 1000);

        return () => clearTimeout(timer);
    }, [search]);

    const queryParams = {
        page,
        items_per_page: itemsPerPage,
        search: debouncedSearch || undefined,
        ...filters,
    };

    const patientsQuery = useQuery({
        queryKey: ["my-patients", queryParams],
        queryFn: () => clinicalHistoryService.queryMyPatients(queryParams),
    });

    return {
        patients: patientsQuery.data?.data || [],
        pagination: patientsQuery.data?.payload?.pagination,
        isLoading: patientsQuery.isLoading,
        isError: patientsQuery.isError,
        error: patientsQuery.error,
        page,
        setPage,
        itemsPerPage,
        setItemsPerPage,
        search,
        setSearch,
        filters,
        setFilters,
        refetch: patientsQuery.refetch,
    };
};
