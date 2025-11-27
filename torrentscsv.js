import AbstractSource from './abstract.js'

export default new class TorrentsCSV extends AbstractSource {
  base = 'https://torrents-csv.com/service/search'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const url = `${this.base}?q=${encodeURIComponent(query)}&size=20`

    try {
      const res = await fetch(url)
      if (!res.ok) return []
      const data = await res.json()
      if (!Array.isArray(data)) return []
      return this.map(data)
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
      return {
        title: item.title || '',
        link: item.magnet || '',
        hash: item.infoHash || '',
        seeders: parseInt(item.seeders || '0'),
        leechers: parseInt(item.leechers || '0'),
        downloads: parseInt(item.completed || '0'),
        size: this.parseSize(item.size || ''),
        date: new Date(item.uploadDate || Date.now()),
        verified: !!item.verified,
        type: 'csv',
        accuracy: 'medium'
      }
    })
  }

  parseSize(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(KiB|MiB|GiB|TiB|KB|MB|GB|TB)/i)
    if (!match) return 0
    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    switch (unit) {
      case 'KIB':
      case 'KB': return value * 1024
      case 'MIB':
      case 'MB': return value * 1024 ** 2
      case 'GIB':
      case 'GB': return value * 1024 ** 3
      case 'TIB':
      case 'TB': return value * 1024 ** 4
      default: return 0
    }
  }

  async test() {
    try {
      const res = await fetch(this.base + '?q=one+piece&size=1')
      return res.ok
    } catch {
      return false
    }
  }
}()
