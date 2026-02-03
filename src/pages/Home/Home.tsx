
export const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center animate-in fade-in duration-700">
            <div
                className="max-w-3xl w-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-12 relative overflow-hidden"
            >
                {/* Background accents */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" />

                <div className="relative z-10 flex flex-col items-center">
                    <div
                        className="mb-8 p-1 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg ring-4 ring-white transition-transform hover:scale-105 duration-300"
                    >
                        <img
                            src="/logo-admin.webp"
                            alt="Nutriva Logo"
                            className="w-32 h-32 object-contain rounded-xl bg-white"
                        />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-emerald-950 to-green-950">
                        Bienvenido a Nutriva HC
                    </h1>

                    <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-8" />

                    <p className="text-xl text-gray-600 leading-relaxed max-w-2xl font-light">
                        Tu plataforma de Historia Clínica Inteligente.
                        Desde aquí puedes gestionar pacientes, realizar seguimientos antropométricos,
                        analizar datos clínicos y organizar tu agenda profesional de forma profesional y eficiente.
                    </p>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <div className="p-6 rounded-2xl bg-white/50 border border-white/60 shadow-sm transition-all hover:bg-white/80 hover:shadow-md">
                            <h3 className="font-bold text-emerald-600 mb-2 uppercase tracking-wider text-xs">Pacientes</h3>
                            <p className="text-sm text-gray-500">Gestión centralizada de toda tu base de pacientes.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/50 border border-white/60 shadow-sm transition-all hover:bg-white/80 hover:shadow-md">
                            <h3 className="font-bold text-green-600 mb-2 uppercase tracking-wider text-xs">Clínica</h3>
                            <p className="text-sm text-gray-500">Historias clínicas detalladas y seguimiento analítico.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/50 border border-white/60 shadow-sm transition-all hover:bg-white/80 hover:shadow-md">
                            <h3 className="font-bold text-emerald-700 mb-2 uppercase tracking-wider text-xs">Agenda</h3>
                            <p className="text-sm text-gray-500">Organización impecable de tus turnos y horarios.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
