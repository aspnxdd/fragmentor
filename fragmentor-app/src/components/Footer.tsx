import type { FC } from 'react';

const Footer: FC = () => {
  return (
    <footer className="w-screen z-0 fixed bottom-0 left-0 flex justify-center items-center bg-teal-100 gap-2 h-10 text-lg text-black">
      built by
      <a
        className="text-teal-800 font-bold"
        href="https://twitter.com/ESArnau"
        target="_blank"
        rel="noreferrer"
      >
        Arnau Espin
      </a>
      -
      <a
        className="text-teal-800 font-bold"
        href="https://github.com/aspnxdd/fragmentor"
        target="_blank"
        rel="noreferrer"
      >
        source code
      </a>
    </footer>
  );
};

export default Footer;
