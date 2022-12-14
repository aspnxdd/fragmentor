import type { FC, PropsWithChildren, MouseEvent } from 'react';

import { useRef, useEffect } from 'react';

type PopupProps = {
  title?: string;
  show: boolean;
  onClose: () => void;
};

const overflow = {
  hidden: 'hidden',
  unset: 'unset',
} as const;

const Popup: FC<PropsWithChildren<PopupProps>> = ({ title, show, onClose, children }) => {
  const backgroundRef = useRef<HTMLDivElement>(null);

  function onBackgroundClick({ target }: MouseEvent) {
    target == backgroundRef.current && onClose();
  }

  useEffect(() => {
    document.body.style.overflow = show ? overflow.hidden : overflow.unset;
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <div
      onClick={onBackgroundClick}
      ref={backgroundRef}
      className="flex items-center justify-center z-10 fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-70"
    >
      <div className="bg-slate-500 rounded-2xl min-w-[40vw] min-h-[40vh] m-10 max-w-[70vw] max-h-[90vh] relative overflow-y-auto">
        <span className="flex bg-black justify-center items-center h-11 sticky w-full">
          {title ? <h1 className="text-white text-2xl font-bold">{title}</h1> : null}
          <button
            className="absolute top-0 right-0 bg-transparent text-white border-0 font-bold p-2 pr-5 text-2xl"
            onClick={onClose}
          >
            X
          </button>
        </span>
        {children}
      </div>
    </div>
  );
};

export default Popup;
