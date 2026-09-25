
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';
import { publishCourseAction } from '@/actions/courseActions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function PublishCourseButton({ courseId }: { courseId: string }) {
    const [isPublishing, setIsPublishing] = useState(false);
    const router = useRouter();
    const t = useTranslations('admin');

    const handlePublish = async () => {
        setIsPublishing(true);
        await publishCourseAction(courseId);
        setIsPublishing(false);
        router.refresh();
    };

    return (
        <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {t('publishCourse.button')}
        </Button>
    );
}
