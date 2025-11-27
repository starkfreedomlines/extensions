import AbstractSource from './abstract.js'

export default new class TorrentsCSV extends AbstractSource {
  base = 'https://torrents-csv.com/service/search'

  /**
   * Search for a single episode
   * @type {import('./').SearchFunction}
   */
  async single({ titles, episode, resolution, exclusions, type }) {
    if (!titles?.length) return []

    const query = titles[0].trim()
    const url = `${this.base}?q=${encodeURIComponent(query)}&size=20`

    try {
      const res = await fetch(url)
      if (!res.ok) return []

      const data = await res.json()
      const results = data.torrents || []

      return this.applyFilters(this.map(results), { episode, resolution, exclusions, type })
    } catch (err) {
      console.error('TorrentsCSV fetch error:', err)
      return []
    }
  }

  /** Batch episodes search */
  batch = this.single

  /** Movie search */
  movie = this.single

  /**
   * Normalize Torrents-CSV API results into TorrentResult format
   */
  map(data) {
    return data.map(item => ({
      title: item.name || '',
      link: `magnet:?xt=urn:btih:${item.infohash}`,
      hash: item.infohash || '',
      seeders: item.seeders || 0,
      leechers: item.leechers || 0,
      downloads: item.completed || 0,
      size: item.size_bytes || 0,
      date: new Date(item.created_unix * 1000),
      verified: false, // Torrents-CSV doesn’t provide verification
      type: 'csv',
      accuracy: 'medium'
    }))
  }

  /**
   * Apply post-fetch filters (episode, resolution, type, exclusions)
   */
  applyFilters(results, { episode, resolution, exclusions, type }) {
    return results.filter(item => {
      const title = item.title.toLowerCase()

      if (episode && !title.includes(episode.toString())) return false
      if (resolution && !title.includes(resolution.toLowerCase())) return false
      if (type && !title.includes(type.toLowerCase())) return false
      if (exclusions?.length) {
        for (const term of exclusions) {
          if (title.includes(term.toLowerCase())) return false
        }
      }
      return true
    })
  }

  /**
   * Connectivity test
   * @returns {Promise<boolean>}
   */
  async test() {
    try {
      const res = await fetch(this.base + '?q=naruto&size=1')
      return res.ok
    } catch {
      return false
    }
  }
}()
