import { useEffect, useRef } from 'react'

export default function Globe({ onCountryClick }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    const initCesium = async () => {
      const Cesium = await import('cesium')
      await import('cesium/Build/Cesium/Widgets/widgets.css')

      Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN

      const viewer = new Cesium.Viewer(containerRef.current, {
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      })

      viewerRef.current = viewer

      viewer.scene.globe.enableLighting = false
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#030712')

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(20, 20, 25000000),
      })

      const COUNTRY_CENTROIDS = {
        // North America
        "United States": [37.0902, -95.7129],
        "Canada": [56.1304, -106.3468],
        "Mexico": [23.6345, -102.5528],
        // Middle East & West Asia
        "Iran": [32.4279, 53.6880],
        "Iraq": [33.2232, 43.6793],
        "Israel": [31.0461, 34.8516],
        "Palestine": [31.9522, 35.2332],
        "Syria": [34.8021, 38.9968],
        "Yemen": [15.5527, 48.5164],
        "Saudi Arabia": [23.8859, 45.0792],
        "Turkey": [38.9637, 35.2433],
        "Lebanon": [33.8547, 35.8623],
        "Jordan": [30.5852, 36.2384],
        "Afghanistan": [33.9391, 67.7100],
        "Pakistan": [30.3753, 69.3451],
        "Kuwait": [29.3117, 47.4818],
        "Qatar": [25.3548, 51.1839],
        "UAE": [23.4241, 53.8478],
        "Oman": [21.4735, 55.9754],
        "Egypt": [26.8206, 30.8025],
        // Europe
        "Russia": [61.5240, 105.3188],
        "Ukraine": [48.3794, 31.1656],
        "United Kingdom": [55.3781, -3.4360],
        "France": [46.2276, 2.2137],
        "Germany": [51.1657, 10.4515],
        "Italy": [41.8719, 12.5674],
        "Spain": [40.4637, -3.7492],
        "Poland": [51.9194, 19.1451],
        "Netherlands": [52.1326, 5.2913],
        "Greece": [39.0742, 21.8243],
        "Sweden": [60.1282, 18.6435],
        "Norway": [60.4720, 8.4689],
        "Finland": [61.9241, 25.7482],
        "Belgium": [50.5039, 4.4699],
        "Switzerland": [46.8182, 8.2275],
        "Austria": [47.5162, 14.5501],
        "Portugal": [39.3999, -8.2245],
        "Romania": [45.9432, 24.9668],
        "Hungary": [47.1625, 19.5033],
        "Czech Republic": [49.8175, 15.4730],
        "Serbia": [44.0165, 21.0059],
        "Croatia": [45.1000, 15.2000],
        "Belarus": [53.7098, 27.9534],
        "Bulgaria": [42.7339, 25.4858],
        // Asia
        "China": [35.8617, 104.1954],
        "India": [20.5937, 78.9629],
        "Japan": [36.2048, 138.2529],
        "South Korea": [35.9078, 127.7669],
        "North Korea": [40.3399, 127.5101],
        "Indonesia": [-0.7893, 113.9213],
        "Thailand": [15.8700, 100.9925],
        "Vietnam": [14.0583, 108.2772],
        "Philippines": [12.8797, 121.7740],
        "Malaysia": [4.2105, 101.9758],
        "Singapore": [1.3521, 103.8198],
        "Myanmar": [21.9162, 95.9560],
        "Bangladesh": [23.6850, 90.3563],
        "Sri Lanka": [7.8731, 80.7718],
        "Nepal": [28.3949, 84.1240],
        "Kazakhstan": [48.0196, 66.9237],
        "Uzbekistan": [41.3775, 64.5853],
        "Kyrgyzstan": [41.2044, 74.7661],
        "Tajikistan": [38.8610, 71.2761],
        "Mongolia": [46.8625, 103.8467],
        "Taiwan": [23.6978, 120.9605],
        "Hong Kong": [22.3193, 114.1694],
        // Africa
        "Nigeria": [9.0820, 8.6753],
        "South Africa": [-30.5595, 22.9375],
        "Ethiopia": [9.1450, 40.4897],
        "Kenya": [-0.0236, 37.9062],
        "Tanzania": [-6.3690, 34.8888],
        "Uganda": [1.3733, 32.2903],
        "Ghana": [7.9465, -1.0232],
        "Morocco": [31.7917, -7.0926],
        "Algeria": [28.0339, 1.6596],
        "Tunisia": [33.8869, 9.5375],
        "Libya": [26.3351, 17.2283],
        "Sudan": [12.8628, 30.2176],
        "Somalia": [5.1521, 46.1996],
        "Mali": [17.5707, -3.9962],
        "Niger": [17.6078, 8.0817],
        "Chad": [15.4542, 18.7322],
        "Cameroon": [7.3697, 12.3547],
        "Democratic Republic of the Congo": [-4.0383, 21.7587],
        "Angola": [-11.2027, 17.8739],
        "Mozambique": [-18.6657, 35.5296],
        "Zimbabwe": [-19.0154, 29.1549],
        "Madagascar": [-18.7669, 46.8691],
        // South America
        "Brazil": [-14.2350, -51.9253],
        "Argentina": [-38.4161, -63.6167],
        "Chile": [-35.6751, -71.5430],
        "Colombia": [4.5709, -74.2973],
        "Venezuela": [6.4238, -66.5897],
        "Peru": [-9.1900, -75.0152],
        "Ecuador": [-1.8312, -78.1834],
        "Bolivia": [-16.2902, -63.5887],
        "Paraguay": [-23.4425, -58.4438],
        "Uruguay": [-32.5228, -55.7658],
        // Oceania
        "Australia": [-25.2744, 133.7751],
        "New Zealand": [-40.9006, 174.8860],
        "Papua New Guinea": [-6.3150, 143.9555],
        "Fiji": [-16.5784, 179.4144],
      }

      // Store entities for hover management
      const countryEntities = new Map()
      
      // Calculate density to reduce opacity in crowded areas
      const calculateDensity = (currentLat, currentLng, allCentroids) => {
        let nearbyCount = 0
        Object.values(allCentroids).forEach(([lat, lng]) => {
          const dist = Math.sqrt(
            Math.pow(currentLat - lat, 2) + Math.pow(currentLng - lng, 2)
          )
          if (dist < 5) { // Countries within 5 degrees
            nearbyCount++
          }
        })
        return nearbyCount
      }

      Object.entries(COUNTRY_CENTROIDS).forEach(([name, [lat, lng]]) => {
        // Reduce opacity in dense areas to prevent yellow blob
        const density = calculateDensity(lat, lng, COUNTRY_CENTROIDS)
        const baseAlpha = density > 5 ? 0.75 : density > 3 ? 0.9 : 1.0
        
        // Create a glow effect using multiple point layers for shadow/highlight
        const position = Cesium.Cartesian3.fromDegrees(lng, lat)
        
        // Outer glow layer (shadow effect - darker, larger)
        viewer.entities.add({
          position: position,
          point: {
            pixelSize: 9,
            color: Cesium.Color.fromCssColorString('#000000').withAlpha(0.2 * baseAlpha),
            outlineColor: Cesium.Color.fromCssColorString('#000000').withAlpha(0.15 * baseAlpha),
            outlineWidth: 7,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 0,
            scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.2, 8.0e7, 0.25),
          },
          show: true,
        })
        
        // Middle glow layer (bright white highlight)
        viewer.entities.add({
          position: position,
          point: {
            pixelSize: 7,
            color: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.4 * baseAlpha),
            outlineColor: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.3 * baseAlpha),
            outlineWidth: 5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 0,
            scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.2, 8.0e7, 0.25),
          },
          show: true,
        })
        
        // Main marker (white with black outline - X/iOS dark mode style)
        const entity = viewer.entities.add({
          position: position,
          point: {
            pixelSize: 6,
            color: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(baseAlpha), // White color
            outlineColor: Cesium.Color.fromCssColorString('#000000').withAlpha(0.8 * baseAlpha), // Black outline
            outlineWidth: 5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 0, // Enable depth testing - markers won't show through globe
            scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.2, 8.0e7, 0.25),
          },
          label: {
            text: name,
            font: '14px JetBrains Mono',
            fillColor: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.95),
            outlineColor: Cesium.Color.fromCssColorString('#000000').withAlpha(0.8),
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -30),
            disableDepthTestDistance: 0, // Enable depth testing - labels won't show through globe
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.0, 8.0e7, 0.3),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#000000').withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(8, 4),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            show: false, // Hide labels by default
          },
          name: name,
        })

        countryEntities.set(name, entity)
        entity.description = name
      })

      // Click handler - check if clicking on an entity first
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      
      handler.setInputAction((click) => {
        // First check if clicking directly on an entity
        const pickedObject = viewer.scene.pick(click.position)
        if (pickedObject && pickedObject.id && pickedObject.id.name) {
          const countryName = pickedObject.id.name
          const [lat, lng] = COUNTRY_CENTROIDS[countryName]
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lng, lat, 4000000),
            duration: 1.5,
          })
          console.log('Country clicked:', countryName)
          if (onCountryClick) {
            onCountryClick(countryName)
          }
          return
        }

        // Fallback to distance-based selection
        const cartesian = viewer.camera.pickEllipsoid(
          click.position,
          viewer.scene.globe.ellipsoid
        )
        if (!cartesian) return

        const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        const clickLat = Cesium.Math.toDegrees(cartographic.latitude)
        const clickLng = Cesium.Math.toDegrees(cartographic.longitude)

        let nearest = null
        let minDist = Infinity
        Object.entries(COUNTRY_CENTROIDS).forEach(([name, [lat, lng]]) => {
          const dist = Math.sqrt(
            Math.pow(clickLat - lat, 2) + Math.pow(clickLng - lng, 2)
          )
          if (dist < minDist) {
            minDist = dist
            nearest = name
          }
        })

        // Increased click radius for easier clicking
        if (nearest && minDist < 30) {
          const [lat, lng] = COUNTRY_CENTROIDS[nearest]
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lng, lat, 4000000),
            duration: 1.5,
          })
          console.log('Country clicked:', nearest)
          if (onCountryClick) {
            onCountryClick(nearest)
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      // Add hover effect to show country name and highlight marker
      let hoveredEntity = null
      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.endPosition)
        
        // Reset previous hover
        if (hoveredEntity && hoveredEntity.label) {
          hoveredEntity.label.show = false
          if (hoveredEntity.point) {
            hoveredEntity.point.pixelSize = 10
            hoveredEntity.point.outlineWidth = 12
          }
        }
        
        if (pickedObject && pickedObject.id && pickedObject.id.name) {
          viewer.canvas.style.cursor = 'pointer'
          hoveredEntity = pickedObject.id
          
          // Show label and highlight the entity
          if (hoveredEntity.label) {
            hoveredEntity.label.show = true
          }
          if (hoveredEntity.point) {
            hoveredEntity.point.pixelSize = 10
            hoveredEntity.point.outlineWidth = 10
            hoveredEntity.point.color = Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(1.0)
            hoveredEntity.point.outlineColor = Cesium.Color.fromCssColorString('#000000').withAlpha(0.9)
          }
        } else {
          viewer.canvas.style.cursor = 'default'
          hoveredEntity = null
          // Reset all entities to default size and opacity
          viewer.entities.values.forEach(entity => {
            if (entity.point && entity.name && COUNTRY_CENTROIDS[entity.name]) {
              const [lat, lng] = COUNTRY_CENTROIDS[entity.name]
              const density = calculateDensity(lat, lng, COUNTRY_CENTROIDS)
              const baseAlpha = density > 5 ? 0.7 : density > 3 ? 0.85 : 1.0
              entity.point.pixelSize = 6
              entity.point.outlineWidth = 5
              entity.point.color = Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(baseAlpha)
              entity.point.outlineColor = Cesium.Color.fromCssColorString('#000000').withAlpha(0.8 * baseAlpha)
            }
          })
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    }

    initCesium().catch((error) => {
      console.error('Error initializing Cesium:', error)
    })

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [onCountryClick])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 1,
      }}
    />
  )
}
