import AbstractSource from './abstract.js'

export default new class TorrentsCSV extends AbstractSource {
  base = 'https://torrents-csv.com/service/search'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode, page = 1, size = 10 }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const url = `${this.base}?q=${encodeURIComponent(query)}&page=${page}&size=${size}`

    try {
      const res = await fetch(url)
      if (!res.ok) return []

      const data = await res.json()
      // TorrentsCSV returns { results: [...] }
      const results = Array.isArray(data) ? data : data.results || []

      return this.map(results)
    } catch (err) {
      console.error('TorrentsCSV fetch error:', err)
      return []
    }
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  movie = this.single

  buildQuery(title, episode) {
    let query = title.replace(/[^\w\s-]/g, ' ').trim()
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    return query
  }

  map(data) {
    return data.map(item => {
      const hash = item.infohash || ''
      return {
        title: item.name || '',
        link: item.magnet || '',
        hash,
        seeders: parseInt(item.seeders || '0'),
        leechers: parseInt(item.leechers || '0'),
        downloads: parseInt(item.completed || '0'),
        size: this.parseSize(item.size || ''),
        date: new Date(item.created_unix * 1000), // TorrentsCSV uses unix timestamp
        verified: false,
        type: 'alt',
        accuracy: 'medium'
      }
    })
  }

  parseSize(sizeStr) {
    const match = String(sizeStr).match(/([\d.]+)\s*(KiB|MiB|GiB|KB|MB|GB)/i)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()

    switch (unit) {
      case 'KIB':
      case 'KB': return value * 1024
      case 'MIB':
      case 'MB': return value * 1024 * 1024
      case 'GIB':
      case 'GB': return value * 1024 * 1024 * 1024
      default: return 0
    }
  }

  async test() {
    try {
      const res = await fetch(this.base + '?q=naruto&size=1')
      return res.ok
    } catch {
      return false
    }
  }
}()
