import { Menu, Bell, HelpCircle, Gift, User as UserIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useUser } from "@/hooks/user/use-user";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EdithUserProfileModal } from "@/sections/panel-control/EdithUserProfileModal";
import { useState } from "react";

export function Header() {
    const { toggleSidebar } = useSidebar();
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

    // Get ID from local storage for initial load
    const userId = useMemo(() => {
        try {
            const stored = localStorage.getItem('data');
            return stored ? JSON.parse(stored).id : undefined;
        } catch {
            return undefined;
        }
    }, []);

    const { user } = useUser(userId);

    // Fallback data if user is loading or not found (could come from LS too for immediate display)
    const displayName = user ? `${user.first_name} ${user.last_name}` : "Cargando...";
    const avatarSrc = user?.avatar || undefined;

    return (
        <header
            className="h-16 bg-white border-b flex items-center justify-between px-6 z-10 shadow-sm sticky top-0"
        >
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="flex text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    onClick={toggleSidebar}
                >
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex items-center space-x-4">

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center space-x-2 pl-4 border-l cursor-pointer hover:opacity-80 transition-opacity">
                            <Avatar className="h-8 w-8 bg-green-100">
                                <AvatarImage src={avatarSrc} alt={displayName} />
                                <AvatarFallback className="bg-green-100 text-primary">
                                    <UserIcon className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700 hidden md:inline-block">{displayName}</span>
                                {/* DEBUG: Remove after fixing */}
                                <span className="text-[10px] text-red-500 max-w-[200px] truncate hidden">{JSON.stringify(user)}</span>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setIsEditProfileModalOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Editar perfil</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <EdithUserProfileModal
                isOpen={isEditProfileModalOpen}
                onClose={() => setIsEditProfileModalOpen(false)}
                userId={userId}
            />
        </header>
    );
}
