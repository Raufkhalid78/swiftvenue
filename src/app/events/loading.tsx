import { Skeleton } from '@/components/ui/skeleton';

export default function EventsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <Skeleton className="h-10 md:h-14 w-64 mx-auto" />
            <Skeleton className="h-5 w-full mx-auto max-w-md" />
            <Skeleton className="h-5 w-3/4 mx-auto max-w-sm" />
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center items-center">
            <Skeleton className="h-10 w-full md:w-64 rounded-md" />
            <Skeleton className="h-10 w-full md:w-48 rounded-md" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col h-full bg-background rounded-xl border border-border overflow-hidden">
                <div className="relative aspect-video w-full">
                  <Skeleton className="w-full h-full rounded-none" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <div className="space-y-2 mt-auto pt-4 border-t border-border/50">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
