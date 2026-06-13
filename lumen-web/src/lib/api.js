import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000, // Increased to 60 seconds for complex operations
})

export const getCountryData = (country) =>
  api.get(`/country/${encodeURIComponent(country)}`).then(r => r.data)

export const getMarkets = (countries) =>
  api.get('/markets', { params: countries ? { countries: countries.join(',') } : {} }).then(r => r.data)
