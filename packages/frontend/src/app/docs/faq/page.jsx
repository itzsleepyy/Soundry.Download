import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function FAQPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    Common questions and troubleshooting tips.
                </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Is Soundry free?</AccordionTrigger>
                    <AccordionContent>
                        Yes, Soundry is free to use. We run on donations to cover server costs.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Why did my download fail?</AccordionTrigger>
                    <AccordionContent>
                        Most failures happen because we couldn't find a high-quality match on YouTube, or the video is region-locked.
                        Try finding the song manually on YouTube to confirm it exists.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Can I download highest quality FLAC?</AccordionTrigger>
                    <AccordionContent>
                        We support FLAC downloads, but the quality is limited by the source material (YouTube).
                        If the source audio is 128kbps, converting it to FLAC won't make it sound better, just larger.
                        Soundry always downloads the highest quality stream available (usually Opus 160kbps or AAC 128kbps) before converting.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>My session is gone. Can I recover it?</AccordionTrigger>
                    <AccordionContent>
                        If you cleared your browser data, your session ID is lost.
                        We cannot recover old sessions because we don't track who owns them.
                        Please start a new session.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>Is this legal?</AccordionTrigger>
                    <AccordionContent>
                        Soundry is a format-shifting tool. Laws regarding format-shifting for personal use vary by country.
                        Please check your local laws. We do not host any copyrighted material; all files are generated temporarily upon request.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
