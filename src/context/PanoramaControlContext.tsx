import React, { useState } from 'react';

type Props = {
  children: React.ReactNode;
};

const nop = () => {
  /* nop */
};

export interface PanoramaControlContextValue {
  src: string;
  setSrc: (src: string) => void;
}

const PanoramaControlContext = React.createContext<PanoramaControlContextValue>(
  {
    src: '',
    setSrc: nop,
  },
);

export const PanoramaControlContextProvider: React.FC<Props> = ({
  children,
}) => {
  const [src, setSrc] = useState<string>('');

  return (
    <PanoramaControlContext.Provider value={{ src, setSrc }}>
      {children}
    </PanoramaControlContext.Provider>
  );
};

export default PanoramaControlContext;
