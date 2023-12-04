import type { FC, PropsWithChildren, MouseEvent } from 'react'

import { useRef, useEffect } from 'react'

type PopupProps = {
  title?: string
  show: boolean
  onClose: () => void
}

const overflow = {
  hidden: 'hidden',
  unset: 'unset',
} as const

const Popup: FC<PropsWithChildren<PopupProps>> = ({ title, show, onClose, children }) => {
  const backgroundRef = useRef<HTMLDivElement>(null)

  function onBackgroundClick({ target }: MouseEvent) {
    if (target == backgroundRef.current) {
      onClose()
    }
  }

  useEffect(() => {
    document.body.style.overflow = show ? overflow.hidden : overflow.unset
  }, [show])

  if (!show) {
    return null
  }

  return (
    <div
      onClick={onBackgroundClick}
      ref={backgroundRef}
      className="flex items-center justify-center z-10 fixed top-0 left-0 w-screen h-screen bg-black/70 transition-all duration-300 ease-in-out overflow-y-auto fade-in"
    >
      <div className="bg-gradient-to-r from-teal-100 to-blue-400 rounded-2xl min-w-[40vw] min-h-[40vh] m-10 max-w-[70vw] max-h-[90vh] overflow-y-auto">
        <span className="flex bg-gradient-to-r from-teal-600 to-blue-700 justify-center items-center h-11 sticky w-full">
          {title ? <h1 className="text-white text-xl font-bold">{title}</h1> : null}
          <button
            className="absolute top-0 right-0 bg-transparent text-white border-0 font-bold p-2 pr-5 text-xl"
            onClick={onClose}
          >
            ⨯
          </button>
        </span>
        {children}
      </div>
    </div>
  )
}

export default Popup
