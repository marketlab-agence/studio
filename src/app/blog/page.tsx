import { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/blog';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Blog - Git Explorer',
  description: 'Articles, tutoriels et astuces pour maîtriser les outils professionnels du développement et du DevOps.',
};

export default function BlogPage() {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-20 lg:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Notre Blog</h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Conseils, astuces et réflexions pour vous aider à devenir plus efficace avec les outils que vous utilisez tous les jours.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 py-12 lg:grid-cols-1">
            {BLOG_POSTS.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                 <Card className="transition-all group-hover:border-primary/50 group-hover:shadow-lg">
                    <CardHeader>
                        <CardTitle className="group-hover:text-primary transition-colors text-2xl">{post.title}</CardTitle>
                        <CardDescription className="pt-2">{post.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center">
                        <div>
                            <Badge variant="secondary">{post.date}</Badge>
                        </div>
                        <div className="flex items-center font-semibold text-primary">
                            Lire la suite <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                    </CardFooter>
                 </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
