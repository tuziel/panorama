import { useState } from 'react';
import Panorama from './components/Panorama';
import Menu from './components/Menu';
import imageUrl from './assets/demo1.jpg';

export default function App() {
  const [panoramaSrc, setPanoramaSrc] = useState<string>(imageUrl);

  function onUpload(dataBase64: string | ArrayBuffer) {
    if (typeof dataBase64 === 'string') {
      setPanoramaSrc(dataBase64);
    }
  }

  return (
    <div className="App">
      <Panorama src={panoramaSrc} />
      <Menu onUpload={onUpload} />
    </div>
  );
}
