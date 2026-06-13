import { useEffect, useRef } from 'react'

export default function ShaderBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const vertSrc = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `

    const fragSrc = `
      precision mediump float;
      uniform float time;
      uniform vec2 resolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;

        // Multiple layers of animated noise
        float n1 = sin(p.x * 6.0 + time * 0.8) * cos(p.y * 4.0 + time * 0.5);
        float n2 = sin(p.x * 12.0 - time * 1.2 + p.y * 3.0) * 0.5;
        float n3 = cos(p.x * 3.0 + p.y * 8.0 - time * 0.6) * 0.7;
        float n4 = sin((p.x + p.y) * 10.0 + time * 1.5) * 0.3;
        float noise = (n1 + n2 + n3 + n4) * 0.35;

        // Radial glow from center
        float dist = length(p);
        float radial = 1.0 - smoothstep(0.0, 1.8, dist);
        radial = pow(radial, 1.5);

        // Color palette — deep black to vivid emerald
        vec3 black = vec3(0.01, 0.02, 0.05);
        vec3 emerald = vec3(0.0, 0.25, 0.18);
        vec3 teal = vec3(0.0, 0.15, 0.22);
        vec3 bright = vec3(0.05, 0.5, 0.35);

        // Mix colors based on noise layers
        vec3 color = mix(black, emerald, noise * 0.5 + 0.5);
        color = mix(color, teal, n2 * 0.5 + 0.3);
        color += bright * pow(max(noise, 0.0), 2.0) * 0.2;

        // Apply radial glow — brighter in center
        color *= 0.2 + radial * 0.7;

        // Add subtle pulsing energy
        float pulse = sin(time * 1.5) * 0.05 + 0.95;
        color *= pulse;

        // Vignette
        color *= 1.0 - dist * 0.3;

        gl_FragColor = vec4(color, 1.0);
      }
    `

    const compile = (type, src) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader))
      }
      return shader
    }

    const program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertSrc))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragSrc))
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]), gl.STATIC_DRAW)

    const pos = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    const timeLoc = gl.getUniformLocation(program, 'time')
    const resLoc = gl.getUniformLocation(program, 'resolution')

    let start = Date.now()
    let raf
    const render = () => {
      const t = (Date.now() - start) / 1000
      gl.uniform1f(timeLoc, t)
      gl.uniform2f(resLoc, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
