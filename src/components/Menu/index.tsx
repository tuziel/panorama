import { useContext, useEffect } from 'react';
import PanoramaControlContext from '@/context/PanoramaControlContext';

import styles from './Menu.module.css';

const imageUrl = '/assets/demo1.jpg';

const Menu: React.FC = () => {
  const { setSrc } = useContext(PanoramaControlContext);

  function onChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = ev.target.files;
    if (!files) return;
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const dataBase64 = ev.target!.result! as string;
      setSrc(dataBase64);
    };
    reader.onerror = () => {
      throw new Error('Can not read file');
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    setSrc(imageUrl);
  }, [setSrc]);

  return (
    <div className={styles.menu}>
      <div>
        <input type="file" name="" id="" onChange={onChange} />
      </div>
    </div>
  );
};

export default Menu;
