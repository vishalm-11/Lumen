import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const src = path.join(__dirname, 'node_modules', 'cesium', 'Build', 'Cesium')
const dest = path.join(__dirname, 'public', 'cesium')

if (fs.existsSync(src)) {
  if (!fs.existsSync(path.join(__dirname, 'public'))) {
    fs.mkdirSync(path.join(__dirname, 'public'))
  }
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true })
  }
  fs.cpSync(src, dest, { recursive: true })
  console.log('✅ Cesium assets copied to public/cesium')
} else {
  console.log('⚠️  Cesium not found. Run "npm install" first.')
}
