import { useEffect, useRef } from 'react'
import {
  COUNTRY_CENTROIDS,
  COUNTRY_MARKER_TIERS,
  getMarkerStyle,
  getTierVisibility,
} from '../data/countryCentroids'

export default function Globe({ onCountryClick }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    let removeCameraListener = null
    let handler = null
    let updateMarkerVisibility = null

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
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0a0f1e')

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(20, 20, 25000000),
      })

      const markerScale = new Cesium.NearFarScalar(1.5e7, 1.5, 8.0e7, 0.5)
      const labelScale = new Cesium.NearFarScalar(1.5e7, 1.1, 8.0e7, 0.4)

      const countryEntities = new Map()
      const markerGroups = new Map()
      let hoveredCountry = null

      const applyLayerOpacity = (entity, visibility, style, layerKind) => {
        if (!entity?.point) return

        const alpha = style.alpha * visibility
        entity.show = visibility > 0.03

        if (layerKind === 'outer') {
          entity.point.color = Cesium.Color.fromCssColorString('#000000').withAlpha(0.2 * alpha)
          entity.point.outlineColor = Cesium.Color.fromCssColorString('#000000').withAlpha(0.15 * alpha)
          return
        }

        if (layerKind === 'middle') {
          entity.point.color = Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.4 * alpha)
          entity.point.outlineColor = Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.3 * alpha)
          return
        }

        entity.point.color = Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(alpha)
        entity.point.outlineColor = Cesium.Color.fromCssColorString('#000000').withAlpha(0.8 * alpha)
      }

      updateMarkerVisibility = () => {
        const altitude = viewer.camera.positionCartographic.height

        markerGroups.forEach((group, countryName) => {
          const tierVisibility = getTierVisibility(group.tier, altitude)
          const isHovered = hoveredCountry === countryName
          const visibility = isHovered ? Math.max(tierVisibility, 0.85) : tierVisibility

          applyLayerOpacity(group.layers.outer, visibility, group.style, 'outer')
          applyLayerOpacity(group.layers.middle, visibility, group.style, 'middle')
          applyLayerOpacity(group.layers.main, visibility, group.style, 'main')

          if (group.layers.main.label) {
            group.layers.main.label.show = isHovered && visibility > 0.1
            if (isHovered) {
              group.layers.main.label.fillColor = Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.95)
            }
          }
        })
      }

      Object.entries(COUNTRY_CENTROIDS).forEach(([name, [lat, lng]]) => {
        const style = getMarkerStyle(lat, lng)
        const tier = COUNTRY_MARKER_TIERS[name] || 'medium'
        const position = Cesium.Cartesian3.fromDegrees(lng, lat)

        const outer = viewer.entities.add({
          position,
          name,
          point: {
            pixelSize: style.pixelSize + 4,
            color: Cesium.Color.fromCssColorString('#000000').withAlpha(0.2 * style.alpha),
            outlineColor: Cesium.Color.fromCssColorString('#000000').withAlpha(0.15 * style.alpha),
            outlineWidth: style.outlineWidth + 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 0,
            scaleByDistance: markerScale,
          },
        })

        const middle = viewer.entities.add({
          position,
          name,
          point: {
            pixelSize: style.pixelSize + 2,
            color: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.4 * style.alpha),
            outlineColor: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.3 * style.alpha),
            outlineWidth: style.outlineWidth + 1,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 0,
            scaleByDistance: markerScale,
          },
        })

        const main = viewer.entities.add({
          position,
          point: {
            pixelSize: style.pixelSize,
            color: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(style.alpha),
            outlineColor: Cesium.Color.fromCssColorString('#000000').withAlpha(0.8 * style.alpha),
            outlineWidth: style.outlineWidth,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 0,
            scaleByDistance: markerScale,
          },
          label: {
            text: name,
            font: '14px DM Sans',
            fillColor: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.95),
            outlineColor: Cesium.Color.fromCssColorString('#000000').withAlpha(0.8),
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -30),
            disableDepthTestDistance: 0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scaleByDistance: labelScale,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#000000').withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(8, 4),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            show: false,
          },
          name,
        })

        countryEntities.set(name, main)
        markerGroups.set(name, {
          tier,
          style,
          layers: { outer, middle, main },
        })
        main.description = name
      })

      updateMarkerVisibility()
      viewer.camera.changed.addEventListener(updateMarkerVisibility)
      removeCameraListener = () => {
        viewer.camera.changed.removeEventListener(updateMarkerVisibility)
      }

      handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

      handler.setInputAction((click) => {
        const pickedObject = viewer.scene.pick(click.position)
        if (!pickedObject?.id?.name || !COUNTRY_CENTROIDS[pickedObject.id.name]) {
          return
        }

        const countryName = pickedObject.id.name
        const altitude = viewer.camera.positionCartographic.height
        const tier = COUNTRY_MARKER_TIERS[countryName] || 'medium'
        if (getTierVisibility(tier, altitude) < 0.1) {
          return
        }

        const [lat, lng] = COUNTRY_CENTROIDS[countryName]
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lng, lat, 4000000),
          duration: 1.5,
        })
        if (onCountryClick) {
          onCountryClick(countryName)
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.endPosition)
        const prevHovered = hoveredCountry
        hoveredCountry = null

        if (pickedObject?.id?.name && COUNTRY_CENTROIDS[pickedObject.id.name]) {
          const countryName = pickedObject.id.name
          const altitude = viewer.camera.positionCartographic.height
          const tier = COUNTRY_MARKER_TIERS[countryName] || 'medium'
          if (getTierVisibility(tier, altitude) >= 0.1) {
            hoveredCountry = countryName
            viewer.canvas.style.cursor = 'pointer'

            const entity = countryEntities.get(countryName)
            const { pixelSize, outlineWidth } = getMarkerStyle(...COUNTRY_CENTROIDS[countryName])
            if (entity?.point) {
              entity.point.pixelSize = pixelSize + 4
              entity.point.outlineWidth = outlineWidth + 4
            }
          }
        }

        if (!hoveredCountry) {
          viewer.canvas.style.cursor = 'default'
          if (prevHovered) {
            const entity = countryEntities.get(prevHovered)
            const { pixelSize, outlineWidth } = getMarkerStyle(...COUNTRY_CENTROIDS[prevHovered])
            if (entity?.point) {
              entity.point.pixelSize = pixelSize
              entity.point.outlineWidth = outlineWidth
            }
          }
        }

        updateMarkerVisibility()
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    }

    initCesium().catch((error) => {
      console.error('Error initializing Cesium:', error)
    })

    return () => {
      if (removeCameraListener) removeCameraListener()
      if (handler && !handler.isDestroyed()) {
        handler.destroy()
      }
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
