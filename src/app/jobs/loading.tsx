export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 animate-pulse">
        {/* Header skeleton */}
        <div className="text-center mb-10">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto mb-3" />
          <div className="h-4 w-96 bg-gray-100 rounded mx-auto" />
        </div>

        {/* Search bar skeleton */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="h-14 bg-white border border-gray-200 rounded-2xl" />
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-3 mb-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full shrink-0" />
          ))}
        </div>

        {/* Job cards skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-16 bg-green-100 rounded-full" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="space-y-1.5 mb-4">
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-2/3 bg-gray-100 rounded" />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-5 w-16 bg-gray-100 rounded-full" />
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
