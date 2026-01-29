import type { Patient } from "@/types/patients";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar, ChevronRight, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PatientCardProps {
    patient: Patient;
    onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
    // Determine the type label color
    const getTypeLabel = (type: string) => {
        const types: Record<string, { label: string, color: string }> = {
            'Influencer': { label: 'Influencer', color: 'bg-purple-50 text-purple-600 border-purple-100' },
            'Premium': { label: 'Premium', color: 'bg-amber-50 text-amber-600 border-amber-100' },
            'Administrador': { label: 'Admin', color: 'bg-blue-50 text-blue-600 border-blue-100' },
            'default': { label: 'Paciente', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
        };
        return types[type] || types['default'];
    };

    const typeInfo = getTypeLabel(patient.type_profile || 'default');

    return (
        <Card
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-none bg-white overflow-hidden ring-1 ring-gray-100"
            onClick={onClick}
        >
            <CardContent className="p-0">
                <div className="flex items-stretch h-full">
                    {/* Left Accent Strip */}
                    <div className="w-1.5 bg-gradient-to-b from-primary/60 to-primary group-hover:w-2 transition-all duration-300" />

                    <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 rounded-2xl ring-4 ring-gray-50 group-hover:ring-primary/10 transition-all duration-300">
                                    <AvatarImage src={patient.avatar || undefined} alt={patient.first_name} />
                                    <AvatarFallback className="bg-emerald-50 text-emerald-600 rounded-2xl">
                                        <User className="h-6 w-6" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">
                                        {patient.first_name} {patient.last_name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${typeInfo.color}`}>
                                            {typeInfo.label}
                                        </Badge>
                                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                            ID: #{patient.id?.toString().padStart(4, '0')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <ChevronRight className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="p-1.5 bg-gray-50 rounded-lg">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                </div>
                                <span className="text-xs truncate max-w-[120px]">{patient.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="p-1.5 bg-gray-50 rounded-lg">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                </div>
                                <span className="text-xs">{patient.phone || 'Sin contacto'}</span>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                <div className="h-7 w-7 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center">
                                    <Activity className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <div className="h-7 w-7 rounded-full border-2 border-white bg-rose-50 flex items-center justify-center">
                                    <Calendar className="h-3.5 w-3.5 text-rose-500" />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-300 uppercase italic">
                                Ver historia clínica
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
