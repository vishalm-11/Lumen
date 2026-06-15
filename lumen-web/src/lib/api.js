import axios from 'axios'
import { API_URL } from '../config'

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Increased to 60 seconds for complex operations
})

export const getCountryData = (country) =>
  api.get(`/country/${encodeURIComponent(country)}`).then(r => r.data)

export const getYoutubeVideo = (country, issue) =>
  api.get(`/api/youtube/${encodeURIComponent(country)}`, {
    params: issue ? { issue } : {},
  }).then(r => r.data)

export const getMarkets = (countries) =>
  api.get('/markets', { params: countries ? { countries: countries.join(',') } : {} }).then(r => r.data)
