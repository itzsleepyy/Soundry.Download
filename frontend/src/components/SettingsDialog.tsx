import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function SettingsDialog() {
    const [open, setOpen] = useState(false)
    const [audioProvider, setAudioProvider] = useState("Youtube")
    const [lyricsProvider, setLyricsProvider] = useState("Genius") // Default
    const [format, setFormat] = useState("MP3")

    // Mock options (usually these would come from your backend/config)
    const audioProviders = ["Youtube", "SoundCloud", "Spotify"]
    const lyricsProviders = ["Genius", "Musixmatch", "AzLyrics"]
    const formats = ["MP3", "FLAC", "WAV", "OGG"]

    const handleSave = () => {
        // Mimic saving
        console.log("Saving settings:", { audioProvider, lyricsProvider, format })
        toast.success("Settings saved successfully")
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure your download preferences.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="audio-provider">Audio Provider</Label>
                        <Select value={audioProvider} onValueChange={setAudioProvider}>
                            <SelectTrigger id="audio-provider">
                                <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                                {audioProviders.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lyrics-provider">Lyrics Provider</Label>
                        <Select value={lyricsProvider} onValueChange={setLyricsProvider}>
                            <SelectTrigger id="lyrics-provider">
                                <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                                {lyricsProviders.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="format">Default Output Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger id="format">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                {formats.map((f) => (
                                    <SelectItem key={f} value={f}>
                                        {f}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
