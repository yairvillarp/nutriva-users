import { useQuery } from "@tanstack/react-query";
import { patientsService } from "@/services/patients/services";
import { useState, useEffect } from "react";

export const usePatients = (initialItemsPerPage: number = 10) => {
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [sort, setSort] = useState<string | undefined>();
    const [order, setOrder] = useState<'ASC' | 'DESC' | undefined>();

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
        sort,
        order,
        ...filters,
    };

    const patientsQuery = useQuery({
        queryKey: ["patients", queryParams],
        queryFn: () => patientsService.queryPatients(queryParams),
    });

    return {
        patients: patientsQuery.data?.data || [],
        pagination: patientsQuery.data?.payload?.pagination,
        allUserIds: patientsQuery.data?.all_user_ids || [],
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
        setSort,
        setOrder,
        refetch: patientsQuery.refetch,
    };
};
