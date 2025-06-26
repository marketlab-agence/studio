'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitCommitHorizontal, GitMerge, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const CommitNode = ({ id, message, isConflict }: { id: string; message: string; isConflict?: boolean }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="flex items-center gap-2"
    >
        <div className={`relative h-8 w-8 rounded-full flex items-center justify-center ${isConflict ? 'bg-destructive' : 'bg-primary'} text-primary-foreground`}>
            <GitCommitHorizontal className="h-4 w-4" />
        </div>
        <div>
            <p className="font-semibold text-sm">{message}</p>
            <p className="font-mono text-xs text-muted-foreground">{id}</p>
        </div>
        {isConflict && <AlertTriangle className="h-5 w-5 text-destructive" />}
    </motion.div>
);

export function ConflictVisualizer() {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Visualiseur de Conflits</CardTitle>
        <CardDescription>
          Un conflit survient lorsque des modifications concurrentes sont apportées aux mêmes lignes d'un fichier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative grid grid-cols-12 gap-y-4 items-center min-h-[200px]">
            {/* Common Ancestor */}
            <div className="col-span-3">
                <CommitNode id="a1b2c3d" message="Commit de base" />
            </div>
            
            {/* Dashed line */}
            <div className="col-span-1 relative h-full">
                <div className="absolute top-1/2 left-1/2 w-full h-px border-t border-dashed border-muted-foreground -translate-y-1/2"></div>
            </div>

            {/* Diverging branches */}
            <div className="col-span-4 space-y-12">
                {/* Main Branch */}
                <div className="relative">
                     <div className="absolute top-4 -left-12 w-12 h-px bg-primary"></div>
                     <div className="absolute -top-8 -left-12 w-px h-[calc(2rem+24px)] bg-primary"></div>
                    <CommitNode id="e4f5g6h" message="Changement 1 (main)" isConflict />
                </div>
                
                {/* Feature Branch */}
                 <div className="relative">
                    <div className="absolute top-4 -left-12 w-12 h-px bg-accent"></div>
                    <div className="absolute top-4 -left-12 w-px h-16 bg-accent"></div>
                    <CommitNode id="i7j8k9l" message="Changement 2 (feature)" isConflict />
                </div>
            </div>

            {/* Merge attempt */}
            <div className="col-span-1 relative h-full">
                 <div className="absolute top-1/2 left-1/2 w-full h-px border-t border-dashed border-muted-foreground -translate-y-1/2"></div>
            </div>
             <div className="col-span-3 flex justify-center">
                <div className="flex flex-col items-center p-3 rounded-lg border-2 border-dashed border-destructive text-destructive">
                    <GitMerge className="h-8 w-8"/>
                    <span className="text-sm font-bold mt-2">CONFLIT</span>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
