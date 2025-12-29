import { Component as EtheralShadow } from "@/components/ui/etheral-shadow"
import { SettingsDialog } from "@/components/SettingsDialog"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Music, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import { Home } from "@/pages/Home"
import { Downloads } from "@/pages/Downloads"
import { Footer } from "@/components/Footer"


function App() {
    const [isDark, setIsDark] = useState(true)

    const toggleTheme = () => {
        const newIsDark = !isDark
        setIsDark(newIsDark)
        if (newIsDark) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark")
        }
    }, [isDark])

    return (
        <div className="relative min-h-screen bg-background font-sans text-foreground selection:bg-orange-500/30">

            {/* 
         Main "Curtain" Content 
         - z-10 to sit ON TOP of the footer.
         - min-h-screen to ensure it covers the screen.
         - mb-[330px] creates the scroll space for the footer to be revealed.
         - bg-background ensures it's opaque (hides footer until scrolled).
      */}
            <div className="relative z-10 bg-background min-h-screen shadow-2xl mb-[300px] flex flex-col">

                {/* Background moves WITH the curtain */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <EtheralShadow
                        color={isDark ? "rgba(255, 100, 0, 0.6)" : "rgba(255, 140, 0, 0.4)"}
                        animation={{ scale: 100, speed: 70 }}
                        noise={{ opacity: 0.1, scale: 1 }}
                    />
                </div>

                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col flex-1">
                    {/* Header */}
                    <header className="w-full container mx-auto flex items-center justify-between p-6">
                        <div className="flex items-center gap-2">
                            <Music className="h-8 w-8 text-orange-500" />
                            <span className="text-xl font-bold tracking-tight">Soundry</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                                {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                            </Button>
                            <SettingsDialog />
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 flex flex-col items-center justify-center w-full">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/downloads" element={<Downloads />} />
                        </Routes>
                    </main>
                </div>
            </div>

            {/* 
         Sticky Reveal Footer
         - fixed at bottom (z-0)
         - hidden by Main Content (z-10) until scrolled
      */}
            <div className="fixed bottom-0 left-0 right-0 z-0 h-[300px]">
                <Footer />
            </div>

            <Toaster />
        </div>
    )
}

export default App