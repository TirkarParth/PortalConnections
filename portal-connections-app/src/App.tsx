import { usePortalData } from './hooks/usePortalData'
import { ConnectionGraph3D } from './components/ConnectionGraph3D'
import './App.css'

function App() {
  const { connections, graph } = usePortalData()

  return (
    <ConnectionGraph3D graph={graph} totalConnections={connections.length} />
  )
}

export default App
