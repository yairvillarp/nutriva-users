import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DailyCommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string) => void;
    mealTitle: string;
    initialText?: string;
}

export function DailyCommentModal({ isOpen, onClose, onSubmit, mealTitle, initialText = "" }: DailyCommentModalProps) {
    const [text, setText] = useState(initialText);

    useEffect(() => {
        if (isOpen) {
            setText(initialText);
        }
    }, [isOpen, initialText]);

    const handleSubmit = () => {
        if (text.trim()) {
            onSubmit(text.trim());
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Comentario para {mealTitle}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="Escribe un comentario o instrucción para esta comida..."
                        className="min-h-[120px] resize-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={!text.trim()}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
