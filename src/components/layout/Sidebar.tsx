import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    ChevronDown,
    User,
    LogOut,
    Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/auth/use-auth";
import {
    Briefcase,
    Calendar,
    Clock,
    Home
} from "lucide-react";
import {
    Sidebar as SidebarComponent,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
    useSidebar
} from "@/components/ui/sidebar";
import { useLocation, useNavigate } from 'react-router-dom';
import { EdithUserProfileModal } from "@/sections/panel-control/EdithUserProfileModal";

interface SidebarProps {
    activeSection?: string;
    setActiveSection?: (section: string) => void;
}

interface UserData {
    id: number;
    username: string;
    email: string;
    roles: string[];
    accessToken: string;
    onboarding: boolean;
    avatar?: string;
}

interface MenuItem {
    id: string;
    title: string;
    icon: React.ReactNode;
    rol: string[];
    items?: MenuItem[];
    isSingle?: boolean;
    level?: number;
}

export function Sidebar({ activeSection: _propActiveSection, setActiveSection: propSetActiveSection }: SidebarProps) {
    let navigate = useNavigate();
    const location = useLocation();
    const [openDropdown, setOpenDropdown] = useState<string>("analisis");
    const [openSubDropdown, setOpenSubDropdown] = useState<string>("");
    const { logout } = useAuth();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    // Internal state if props are not provided
    const [_internalActiveSection, setInternalActiveSection] = useState(location.pathname);

    const setActiveSection = propSetActiveSection || setInternalActiveSection;

    // Obtener datos del usuario desde localStorage
    const userData = useMemo(() => {
        const storedData = localStorage.getItem('data');
        if (storedData) {
            try {
                return JSON.parse(storedData) as UserData;
            } catch (error) {
                console.error('Error parsing user data from localStorage:', error);
            }
        }
        return null;
    }, []);

    // Obtener roles desde userData
    const roles = useMemo(() => {
        return userData?.roles || ['user'];
    }, [userData]);

    // Obtener información del usuario
    const username = userData?.username || 'Usuario';
    const email = userData?.email || 'usuario@ejemplo.com';
    const avatar = userData?.avatar || '/placeholder.svg';

    const toggleDropdown = (dropdown: string, level: number = 1) => {
        if (level === 1) {
            setOpenDropdown(prevOpen => prevOpen === dropdown ? "" : dropdown);
            // Cerrar submenús cuando se cierra el menú principal
            if (openDropdown === dropdown) {
                setOpenSubDropdown("");
            }
        } else if (level === 2) {
            setOpenSubDropdown(prevOpen => prevOpen === dropdown ? "" : dropdown);
        }
    };

    // Función para verificar si el usuario tiene al menos uno de los roles requeridos
    const hasAnyRole = (requiredRoles: string[]): boolean => {
        if (!requiredRoles || requiredRoles.length === 0) return true; // Keep safe
        return requiredRoles.some(requiredRole => roles.includes(requiredRole));
    };

    const menuItems: MenuItem[] = [
        {
            id: "/home",
            title: "Home",
            icon: <Home className="h-4 w-4" />,
            rol: [],
            isSingle: true,
            level: 1
        },
        {
            id: "/usuarios",
            title: "Usuarios",
            icon: <User className="h-4 w-4" />,
            rol: [],
            isSingle: true,
            level: 1
        },
        {
            id: "/mis-pacientes",
            title: "Mis pacientes",
            icon: <User className="h-4 w-4" />,
            rol: [],
            isSingle: true,
            level: 1
        },
        {
            id: "/especialidades",
            title: "Especialidades",
            icon: <Briefcase className="h-4 w-4" />,
            rol: [],
            isSingle: true,
            level: 1
        },
        // {
        //     id: "/",
        //     title: "Informaciones",
        //     icon: <ChartNoAxesCombinedIcon />,
        //     rol: [], // Empty role means accessible to all (based on logic below) or I can set standard roles
        //     isSingle: true,
        //     level: 1
        // },
        // {
        //     id: "/mediciones",
        //     title: "Mediciones",
        //     icon: <ChartNoAxesCombinedIcon />,
        //     rol: [],
        //     isSingle: true,
        //     level: 1
        // },
        {
            id: "profesionales",
            title: "Profesionales",
            icon: <Briefcase className="h-4 w-4" />,
            rol: ['USER:PROFECIONAL', 'SCHEDULES:READ:WRITE', 'USERS:READ:WRITE'],
            items: [
                { id: "/admin/schedules", title: "Agenda", icon: <Calendar className="h-4 w-4" />, rol: ['SCHEDULES:READ:WRITE'] },
                { id: "/admin/appointment", title: "Turnos", icon: <Clock className="h-4 w-4" />, rol: ['USERS:READ:WRITE'] },
                { id: "/admin/appointment-profesional", title: "Mis Turnos", icon: <User className="h-4 w-4" />, rol: ['USER:PROFECIONAL'] },
            ],
        }
    ];


    // Función recursiva para filtrar items basado en roles
    const filterMenuItemsByRoles = (items: MenuItem[]): MenuItem[] => {
        return items
            .filter(section => {
                // If no roles defined, allow access (or default logic)
                if (!section.rol || section.rol.length === 0) return true;
                return hasAnyRole(section.rol)
            })
            .map(section => {
                if (section.items) {
                    const filteredItems = filterMenuItemsByRoles(section.items);
                    if (filteredItems.length > 0) {
                        return { ...section, items: filteredItems };
                    }
                    // Si no tiene items después del filtrado, mantenerlo si es un item de nivel 3
                    return section.items && section.items.length > 0 ? section : null;
                }
                return section;
            })
            .filter(Boolean) as MenuItem[];
    };

    // Filtrar menuItems basado en los roles del usuario
    const filteredMenuItems = useMemo(() => {
        return filterMenuItemsByRoles(menuItems);
    }, [roles]);

    // Función para renderizar items recursivamente
    const renderMenuItem = (item: MenuItem, level: number = 1): React.ReactNode => {
        // Si es influencer único, mostrar como botón directo
        if (item.isSingle) {
            return (
                <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-sm hover:bg-[#4E73DF]/10 hover:text-[#4E73DF]",
                        isCollapsed ? "px-2" : "px-3",
                        level === 2 && !isCollapsed ? "pl-8" : "",
                        level === 3 && !isCollapsed ? "pl-12" : "",
                        location.pathname === item.id
                            ? "bg-gradient-to-r from-[#4E73DF]/15 to-[#5A67D8]/15 text-[#4E73DF] border-r-2 border-[#4E73DF] font-medium"
                            : ""
                    )}
                    onClick={() => {
                        setActiveSection(item.id);
                        navigate(item.id);
                    }}
                >
                    {level === 1 && <span className="text-lg">{item.icon}</span>}
                    {!isCollapsed && <span>{item.title}</span>}
                </Button>
            );
        }

        // Si no tiene items (es un item terminal con ruta directa)
        if (!item.items || item.items.length === 0) {
            return (
                <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-sm hover:bg-[#4E73DF]/10 hover:text-[#4E73DF]",
                        isCollapsed ? "px-2" : "px-3",
                        level === 2 && !isCollapsed ? "pl-8" : "",
                        level === 3 && !isCollapsed ? "pl-12" : "",
                        location.pathname === item.id
                            ? "bg-gradient-to-r from-[#4E73DF]/15 to-[#5A67D8]/15 text-[#4E73DF] border-r-2 border-[#4E73DF] font-medium"
                            : ""
                    )}
                    onClick={() => {
                        setActiveSection(item.id);
                        navigate(item.id);
                    }}
                >
                    {level === 1 && <span className="text-lg">{item.icon}</span>}
                    {!isCollapsed && <span>{item.title}</span>}
                </Button>
            );
        }

        // Si tiene items, verificar si después del filtrado solo tiene uno
        // En ese caso, convertirlo en un enlace directo al primer (y único) hijo
        if (item.items.length === 1 && item.items[0].id.startsWith('/')) {
            const singleChild = item.items[0];
            return (
                <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-sm hover:bg-[#4E73DF]/10 hover:text-[#4E73DF]",
                        isCollapsed ? "px-2" : "px-3",
                        level === 2 && !isCollapsed ? "pl-8" : "",
                        level === 3 && !isCollapsed ? "pl-12" : "",
                        location.pathname === singleChild.id
                            ? "bg-gradient-to-r from-[#4E73DF]/15 to-[#5A67D8]/15 text-[#4E73DF] border-r-2 border-[#4E73DF] font-medium"
                            : ""
                    )}
                    onClick={() => {
                        setActiveSection(singleChild.id);
                        navigate(singleChild.id);
                    }}
                >
                    {level === 1 && <span className="text-lg">{item.icon}</span>}
                    {!isCollapsed && <span>{item.title}</span>}
                </Button>
            );
        }

        // Si tiene múltiples items (es un grupo colapsable)
        const isOpen = level === 1 ? openDropdown === item.id : openSubDropdown === item.id;

        return (
            <Collapsible
                key={item.id}
                open={isOpen}
                onOpenChange={() => toggleDropdown(item.id, level)}
            >
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-between text-left font-medium hover:bg-[#4E73DF]/10 hover:text-[#4E73DF]",
                            isCollapsed ? "px-2" : "px-2",
                            level === 2 && !isCollapsed ? "pl-8" : "",
                            level === 3 && !isCollapsed ? "pl-12" : ""
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {level === 1 && <span className="text-lg">{item.icon}</span>}
                            {!isCollapsed && <span>{item.title}</span>}
                        </div>
                        {!isCollapsed && item.items.length > 0 && (
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen ? "rotate-180" : ""
                                )}
                            />
                        )}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                    {item.items.map(subItem => renderMenuItem(subItem, level + 1))}
                </CollapsibleContent>
            </Collapsible>
        );
    };

    return (
        <SidebarComponent
            className="border-r border-gray-200"
            collapsible="icon"
        >
            <SidebarHeader className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#4E73DF] to-[#5A67D8]">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <h2 className="text-lg font-semibold text-white">
                            Nutriva HC
                        </h2>
                    )}
                    <SidebarTrigger className="h-8 w-8 p-0 text-white hover:bg-white/20" />
                </div>
            </SidebarHeader>

            <SidebarContent className="p-2 space-y-2">
                {filteredMenuItems.map((item) => renderMenuItem(item))}
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-200 p-4 bg-gray-50">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full h-auto hover:bg-[#4E73DF]/10 flex items-center",
                                isCollapsed ? "justify-center p-0" : "justify-start p-2 px-3"
                            )}
                        >
                            <div className={cn(
                                "flex items-center gap-2 w-full",
                                isCollapsed ? "justify-center" : ""
                            )}>
                                <Avatar className="h-8 w-8 ring-2 ring-[#4E73DF]/20">
                                    <AvatarImage
                                        src={avatar}
                                        alt="Usuario"
                                    />
                                    <AvatarFallback className="bg-gradient-to-r from-[#4E73DF] to-[#5A67D8] text-white">
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium text-gray-800">
                                            {username}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {email}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem className="hover:bg-[#4E73DF]/10 hover:text-[#4E73DF]"
                            onClick={() => setIsAddUserModalOpen(true)}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configuración</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 hover:bg-red-50"
                            onClick={logout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>

            <EdithUserProfileModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                userId={userData?.id}
            />
        </SidebarComponent>
    );
}
