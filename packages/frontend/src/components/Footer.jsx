import Link from 'next/link';
import { Github, MessageSquare } from 'lucide-react';
import ScrambleHover from './fancy/text/scramble-hover';

export default function Footer() {
    return (
        <div className="sticky z-0 bottom-0 left-0 w-full h-80 bg-zinc-900 flex justify-center items-center text-zinc-200">
            <div className="relative overflow-hidden w-full h-full flex justify-end px-12 text-right items-start py-12">
                <div className="flex flex-row space-x-12 sm:space-x-16 md:space-x-24 text-sm sm:text-lg md:text-xl z-20">
                    <ul className="space-y-2">
                        <li className="hover:underline cursor-pointer"><Link href="/">Home</Link></li>
                        <li className="hover:underline cursor-pointer"><Link href="/docs">Docs</Link></li>
                        <li className="hover:underline cursor-pointer"><Link href="/library">Library</Link></li>
                    </ul>
                    <ul className="space-y-2">
                        <li className="hover:underline cursor-pointer group flex items-center justify-end gap-2">
                            <a href="#" target="_blank" rel="noreferrer">Github</a> <Github className="w-4 h-4" />
                        </li>
                        <li className="hover:underline cursor-pointer group flex items-center justify-end gap-2">
                            <a href="https://discord.gg/heJSfWtZrP" target="_blank" rel="noreferrer">Discord</a> <MessageSquare className="w-4 h-4" />
                        </li>
                    </ul>
                </div>
                <h2 className="absolute bottom-0 left-0 translate-y-1/3 sm:text-[192px] text-[80px] font-bold text-zinc-800 pointer-events-auto select-none tracking-tighter hover:text-zinc-700 transition-colors">
                    <ScrambleHover
                        text="Soundry"
                        scrambleSpeed={50}
                        maxIterations={15}
                        useOriginalCharsOnly={false}
                        className="cursor-default"
                    />
                </h2>
            </div>
        </div>
    );
}
