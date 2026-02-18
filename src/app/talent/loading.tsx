export default function TalentLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 animate-pulse">
        {/* Header skeleton */}
        <div className="text-center mb-10">
          <div className="h-8 w-72 bg-gray-200 rounded-lg mx-auto mb-3" />
          <div className="h-4 w-80 bg-gray-100 rounded mx-auto" />
        </div>

        {/* Search skeleton */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="h-14 bg-white border border-gray-200 rounded-2xl" />
        </div>

        {/* Talent cards skeleton */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-gray-200 rounded mb-1.5" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-5 w-14 bg-gray-100 rounded-full" />
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="h-4 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-12 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
