// import { useEffect, useRef } from 'react';
import './index.css';

interface MenuProps {
  onUpload: (file: string | ArrayBuffer) => void;
}

export default function Menu(props: MenuProps) {
  function onChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = ev.target.files;
    if (!files) throw new Error('No files');

    const file = files[0];
    var reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      props.onUpload(ev.target!.result!);
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
}
