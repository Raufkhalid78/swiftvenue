import { Skeleton } from '@/components/ui/skeleton';

export default function EventLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <div className="relative">
          {/* Cover image skeleton */}
          <div className="w-full aspect-[21/9] md:aspect-[21/7] max-h-[400px]">
            <Skeleton className="w-full h-full rounded-none" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative -mt-16 md:-mt-24 z-10">
            <div className="bg-background rounded-2xl shadow-xl border border-border p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="space-y-4 flex-1">
                  <Skeleton className="h-10 md:h-12 w-3/4" />
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
                <div className="w-full md:w-auto">
                  <Skeleton className="h-12 w-full md:w-48 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-background rounded-xl border border-border p-6 md:p-8 space-y-4">
                  <Skeleton className="h-8 w-48 mb-6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full mt-4" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-background rounded-xl border border-border p-6 space-y-4">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-5 h-5 rounded-full mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-5 h-5 rounded-full mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-background rounded-xl border border-border p-6 space-y-4">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
