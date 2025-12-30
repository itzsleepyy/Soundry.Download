import ScrambleHover from '@/components/fancy/text/scramble-hover';

export default function Docs() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight uppercase">
                <ScrambleHover
                    text="Coming Soon"
                    scrambleSpeed={50}
                    maxIterations={20}
                    className="cursor-default"
                />
            </h1>
            <p className="text-muted-foreground text-lg">
                Documentation is currently under construction.
            </p>
        </div>
    );
}
