
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GitMerge, GitPullRequest, GitCommit, ArrowRight, CornerDownRight, Users } from 'lucide-react';

export function GitGraph() {
  return (
    <div className="my-8">
      <h3 className="text-xl font-bold mb-4">Illustration du Flux Git</h3>
      <Card className="bg-muted/50">
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-x-4 gap-y-8 font-code text-sm">
                
                {/* Headers */}
                <div className="text-center font-bold text-primary">LOCAL</div>
                <div></div>
                <div className="text-center font-bold text-primary">LOCAL</div>
                <div></div>
                <div className="text-center font-bold text-accent">REMOTE</div>

                {/* Row 1: Working Directory -> Staging Area */}
                <div className="p-3 bg-background rounded-lg text-center">Working Directory</div>
                <div className="flex justify-center items-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground"/>
                </div>
                <div className="p-3 bg-background rounded-lg text-center">Staging Area</div>
                <div />
                <div />
                <div/>
                <div className="text-center text-xs font-mono text-muted-foreground">git add</div>
                <div />

                {/* Row 2: Staging Area -> Local Repo */}
                <div />
                <div />
                <div className="flex justify-center items-center rotate-90 md:rotate-0">
                    <CornerDownRight className="h-8 w-8 text-muted-foreground transform -scale-y-100 md:scale-y-100 md:-rotate-90"/>
                </div>
                <div />
                <div />
                <div />
                <div />
                <div className="text-center text-xs font-mono text-muted-foreground">git commit</div>
                <div />


                {/* Row 3: Local Repo <-> Remote Repo */}
                <div className="p-3 bg-background rounded-lg text-center">Local Repo (.git)</div>
                <div className="flex flex-col items-center">
                    <ArrowRight className="h-6 w-6 text-accent"/>
                    <ArrowLeft className="h-6 w-6 text-accent"/>
                </div>
                <div className="p-3 bg-accent/20 rounded-lg text-center border border-accent">Remote Repo (origin)</div>
                <div />
                <div />
                <div />
                <div className="text-center text-xs font-mono text-accent">git push / git pull</div>
                <div />

            </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ArrowLeft = (props: React.ComponentProps<'svg'>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
)
