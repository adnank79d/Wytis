export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
            {/* Subtle Background Effect */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full opacity-50 pointer-events-none" />
            </div>

            <div className="relative z-10 w-full max-w-[440px]">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2.5">
                        <div className="">
                            <img src="/logo.png" alt="Wytis" className="h-10 w-10 object-contain" />
                        </div>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}
