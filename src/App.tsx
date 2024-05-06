import Panorama from './components/Panorama';
import Menu from './components/Menu';
import { PanoramaControlContextProvider } from './context/PanoramaControlContext';

export default function App() {
  return (
    <div className="App">
      <PanoramaControlContextProvider>
        <Panorama />
        <Menu />
      </PanoramaControlContextProvider>
    </div>
  );
}
