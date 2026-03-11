import { useEffect, useState } from 'react'
import { newsApi } from '@/api'

interface NewsItem {
  id: number
  title: string
  content: string
  image_path: string | null
  author_name: string | null
  created_at: string
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function NewsCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-cyan-200 transition-all group"
    >
      {item.image_path && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={`/uploads/${item.image_path}`}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
          {item.author_name && (
            <>
              <span className="text-gray-200">•</span>
              <span className="text-xs text-cyan-500">{item.author_name}</span>
            </>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 group-hover:text-cyan-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
          {item.content}
        </p>
        <div className="mt-3 text-xs text-cyan-500 font-medium">Читать далее →</div>
      </div>
    </div>
  )
}

function NewsModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {item.image_path && (
          <div className="w-full h-64 overflow-hidden rounded-t-3xl">
            <img src={`/uploads/${item.image_path}`} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
            {item.author_name && (
              <>
                <span className="text-gray-200">•</span>
                <span className="text-xs text-cyan-500">{item.author_name}</span>
              </>
            )}
          </div>
          <h2 className="font-bold text-gray-900 text-xl leading-snug mb-4">{item.title}</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
          <button
            onClick={onClose}
            className="mt-6 w-full py-3 rounded-2xl text-white font-semibold text-sm transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewsPage() {
  const [news, setNews]         = useState<NewsItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<NewsItem | null>(null)
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const PER_PAGE = 9

  const load = (p: number) => {
    setLoading(true)
    newsApi.list(p, PER_PAGE)
      .then(r => {
        setNews(r.data.news)
        setTotal(r.data.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <section className="container max-w-7xl mx-auto py-6 px-4">
      <h1 className="font-bold text-2xl text-gray-900 mb-6">Новости</h1>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-gray-400 text-sm">Загрузка...</div>
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="text-5xl mb-4">📰</div>
          <p className="text-gray-500 text-sm">Новостей пока нет</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {news.map(item => (
              <NewsCard key={item.id} item={item} onClick={() => setSelected(item)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >← Назад</button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >Вперёд →</button>
            </div>
          )}
        </>
      )}

      {selected && <NewsModal item={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
