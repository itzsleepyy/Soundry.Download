const env = import.meta.env

const config = {
  PROTOCOL: env.VITE_PROTOCOL || window.location.protocol,
  WS_PROTOCOL:
    env.VITE_WS_PROTOCOL ||
    (window.location.protocol === 'https:' ? 'wss:' : 'ws:'),
  BACKEND: env.VITE_BACKEND || window.location.hostname,
  PORT: env.VITE_PORT || window.location.port,
  WS_PORT: env.VITE_WS_PORT || window.location.port,
  BASEURL: env.VITE_BASEURL || '',
}

export default config
