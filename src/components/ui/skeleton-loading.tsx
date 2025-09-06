import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const KPISkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, index) => (
      <Card key={index} className="bg-white/50 backdrop-blur-sm rounded-[30px] border border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-3 w-16" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <Card className="bg-white/50 backdrop-blur-sm rounded-[30px] border border-white/20">
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className={`w-full h-${height}`} style={{ height: `${height}px` }} />
    </CardContent>
  </Card>
);

export const MonthSelectorSkeleton = () => (
  <Skeleton className="h-10 w-48 rounded-lg" />
);

export const InsightsSkeleton = () => (
  <Card className="bg-white/50 backdrop-blur-sm rounded-[30px] border border-white/20">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);