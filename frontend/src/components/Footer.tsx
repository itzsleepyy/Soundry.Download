import { Music } from "lucide-react"

export function Footer() {
    return (
        <div className="w-full bg-black text-white flex justify-center items-center py-12 md:h-90 relative z-0" style={{ minHeight: '300px' }}>
            <div className="w-full container mx-auto px-6 h-full flex flex-col md:flex-row justify-between items-start md:items-center relative">

                {/* Links Section */}
                <div className="flex flex-row space-x-12 sm:space-x-16 md:space-x-24 text-sm sm:text-lg md:text-xl font-medium z-10">
                    <ul className="space-y-2">
                        <li className="hover:text-orange-500 cursor-pointer transition-colors">Home</li>
                        <li className="hover:text-orange-500 cursor-pointer transition-colors">Docs</li>
                        <li className="hover:text-orange-500 cursor-pointer transition-colors">Comparisons</li>
                    </ul>
                    <ul className="space-y-2">
                        <li className="hover:text-orange-500 cursor-pointer transition-colors">Github</li>
                        <li className="hover:text-orange-500 cursor-pointer transition-colors">Instagram</li>
                        <li className="hover:text-orange-500 cursor-pointer transition-colors">Twitter (X)</li>
                    </ul>
                </div>

                {/* Large Fancy Text */}
                <h2 className="absolute bottom-0 right-0 translate-y-1/4 sm:text-[150px] text-[80px] font-bold text-orange-500/20 leading-none select-none pointer-events-none">
                    Soundry
                </h2>

                {/* Mobile Logo fallback */}
                <div className="md:hidden mt-8 text-orange-500/50">
                    <Music className="h-12 w-12" />
                </div>

            </div>
        </div>
    )
}
