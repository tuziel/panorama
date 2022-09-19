// import { useEffect, useRef } from 'react';
import { useContext } from 'react';
import PanoramaControlContext from 'src/context/PanoramaControlContext';
import './index.css';

const Menu: React.FC = () => {
  const { setSrc } = useContext(PanoramaControlContext);

  function onChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = ev.target.files;
    if (!files) return;
    const file = files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const dataBase64 = ev.target!.result! as string;
      setSrc(dataBase64);
    };
    reader.onerror = () => {
      throw new Error('Can not read file');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="Menu">
      <div>
        <input type="file" name="" id="" onChange={onChange} />
      </div>
    </div>
  );
};

export default Menu;
