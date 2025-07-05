import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BLOG_POSTS, BlogPost } from '@/lib/blog';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import Image from 'next/image';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    return {
      title: 'Article non trouvé',
    };
  }

  return {
    title: `${post.title} - Katalyst Blog`,
    description: post.description,
  };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: Props) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="flex-1 py-12 md:py-16">
      <article className="container max-w-3xl px-4 md:px-6">
        <header className="mb-8 text-center">
          <p className="text-muted-foreground">{post.date} &bull; Par {post.author}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tighter sm:text-5xl">{post.title}</h1>
        </header>

        <Image
          src="https://placehold.co/1200x600.png"
          alt={post.title}
          width={1200}
          height={600}
          className="aspect-[2/1] w-full rounded-lg object-cover mb-12"
          data-ai-hint="blog technology abstract"
        />

        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline ? (
                  <CodeBlock className="my-6 text-sm">{String(children).replace(/\n$/, '')}</CodeBlock>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
               blockquote({children}) {
                return (
                    <Alert className="bg-muted/50 my-6">
                        <Lightbulb className="h-5 w-5" />
                        <AlertTitle>Bon à savoir</AlertTitle>
                        <AlertDescription>
                            {children}
                        </AlertDescription>
                    </Alert>
                )
            }
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
