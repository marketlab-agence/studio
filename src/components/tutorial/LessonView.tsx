import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lesson } from '@/types/tutorial.types';
import ReactMarkdown from 'react-markdown';

type LessonViewProps = {
    lesson: Lesson;
};

export function LessonView({ lesson }: LessonViewProps) {
    return (
        <Card className="flex-1 border-0 shadow-none rounded-none bg-transparent">
            <CardHeader>
                <CardTitle className="text-3xl">{lesson.title}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{lesson.content}</ReactMarkdown>
                {lesson.component && React.createElement(lesson.component)}
            </CardContent>
        </Card>
    );
}
