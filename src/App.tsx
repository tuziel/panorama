import { useState } from 'react';
import Panorama from './components/Panorama/s2bDemo';
import Menu from './components/Menu';

export default function App() {
  const [panoramaSrc, setPanoramaSrc] = useState<string>('');

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
