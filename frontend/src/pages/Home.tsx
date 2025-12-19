import Typewriter from "@/components/fancy/text/typewriter"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Music, Download } from "lucide-react"
import { IconBrandSpotify, IconBrandSoundcloud, IconBrandYoutube } from "@tabler/icons-react"
import { useState } from "react"
import { toast } from "sonner"

export function Home() {
  const [url, setUrl] = useState("")
  const [format, setFormat] = useState("FLAC")

  const handleDownload = () => {
    if (!url) {
      toast.error("Please enter a URL")
      return
    }
    console.log("Downloading...", { url, format })
    toast.success(`Starting download for ${format}...`)
  }

  const platforms = [
    { name: "Spotify", icon: <IconBrandSpotify size={20} className="text-[#1DB954]" /> },
    { name: "SoundCloud", icon: <IconBrandSoundcloud size={20} className="text-[#FF5500]" /> },
    { name: "YouTube Music", icon: <IconBrandYoutube size={20} className="text-[#FF0000]" /> },
    { name: "+ Many More", icon: null },
  ]

  return (
    <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto w-full px-4">

      {/* Logo/Icon Large */}
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-orange-500/20 blur-xl"></div>
        <Music className="relative h-24 w-24 text-orange-500 drop-shadow-lg" />
      </div>

      {/* Titles */}
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          Soundry
        </h1>
        <div className="h-8 text-xl font-medium text-muted-foreground sm:text-2xl">
          <Typewriter
            text={[
              "Universal Cloud Audio Downloader",
              "Music for everyone.",
              "Spotify, SoundCloud, YouTube.",
              "Lowering barriers for DJs.",
              "High quality audio extraction."
            ]}
            speed={50}
            waitTime={2500}
            loop={true}
            cursorChar={"_"}
          />
        </div>
      </div>

      {/* Platform Badges */}
      <div className="flex flex-wrap justify-center gap-2">
        {platforms.map((platform) => (
          <Badge key={platform.name} variant="secondary" className="bg-secondary/50 backdrop-blur-sm px-4 py-1.5 text-sm hover:bg-secondary/70 transition-colors flex items-center gap-2">
            {platform.icon}
            {platform.name}
          </Badge>
        ))}
      </div>

      {/* Search Box */}
      <div className="w-full max-w-2xl mt-12 p-1.5 bg-card/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2">

        {/* Format Selector */}
        <div className="w-full md:w-[130px]">
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MP3">MP3</SelectItem>
              <SelectItem value="FLAC">FLAC</SelectItem>
              <SelectItem value="WAV">WAV</SelectItem>
              <SelectItem value="M4A">M4A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-border w-px h-8 self-center hidden md:block opacity-20"></div>

        {/* URL Input */}
        <div className="flex-1">
          <Input
            placeholder="https://open.spotify.com/track/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-12 text-base placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Download Button */}
        <Button
          size="lg"
          onClick={handleDownload}
          className="h-12 px-8 text-base font-semibold"
        >
          Download <Download className="ml-2 h-4 w-4" />
        </Button>
      </div>

    </div>
  )
}
