import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { ExternalLink, ArrowLeft } from "lucide-react"

export function SidebarCTA() {
    return (
        <Card className="shadow-none rounded-md bg-transparent border-none">
            {/* Using bg-transparent/border-none to blend better if desired, 
            or keep default card style. User's image shows a dark card.
            Let's stick to default Card style first, maybe add class for Sidebar context.
            User snippet had: className="gap-2 py-4 shadow-none"
        */}
            <CardHeader className="p-4 pb-0">
                <CardTitle className="text-sm">Community & Help</CardTitle>
                <CardDescription>
                    Join our Discord for support or return to the app.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2.5 p-4">
                <Button
                    className="w-full shadow-none justify-start"
                    size="sm"
                    asChild
                >
                    <Link href="https://discord.gg/soundry" target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Discord
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    className="w-full shadow-none justify-start"
                    size="sm"
                    asChild
                >
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to App
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
