import type { FC, PropsWithChildren, MouseEvent } from "react";

import { useRef, useEffect } from "react";

interface IPopup {
  title?: string;
  show: boolean;
  onClose: () => void;
}

const Popup: FC<PropsWithChildren<IPopup>> = ({
  title,
  show,
  onClose,
  children,
}) => {
  const backgroundRef = useRef<HTMLDivElement>(null);

  const onBackgroundClick = ({ target }: MouseEvent) =>
    target == backgroundRef.current && onClose();

  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "unset";
  }, [show]);

  if (!show) return null;
  return (
    <div
      onClick={onBackgroundClick}
      ref={backgroundRef}
      className="flex items-center justify-center z-10 fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-70"
    >
      <div className="bg-slate-500 min-w-[40vw] min-h-[40vh] m-10 max-w-[90vw] max-h-[90vh] relative overflow-y-auto">
        <span className="flex bg-black justify-center items-center h-11 sticky w-full">
          {title && <h1 className="text-white">{title}</h1>}
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
