'use client';

import {
    Banner,
    BannerClose,
    BannerIcon,
    BannerTitle,
} from '@/components/ui/banner';
import { Clock } from 'lucide-react';

export default function AnnouncementBanner() {
    return (
        <Banner className="bg-amber-500/10 border-b border-amber-500/20 text-foreground justify-center">
            <BannerIcon icon={Clock} className="text-amber-500 border-amber-500/20 bg-amber-500/10" />
            <BannerTitle className="text-center">
                <span className="font-semibold">Experiencing high demand:</span> Downloads may take longer than usual. We're working on scaling up servers. Thank you for your patience! 🙏
            </BannerTitle>
            <BannerClose />
        </Banner>
    );
}
