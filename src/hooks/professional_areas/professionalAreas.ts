import { useQuery } from "@tanstack/react-query";
import { MockApi } from "@/services/mockApi";

export function useGetProfessionalAreas() {
    return useQuery({
        queryKey: ["professionalAreas"],
        queryFn: () => MockApi.getProfessionalAreas(),
    });
}
