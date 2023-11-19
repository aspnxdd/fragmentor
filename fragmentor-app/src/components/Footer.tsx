import type { FC } from 'react';

const Footer: FC = () => {
  return (
    <footer className="w-screen z-0 fixed bottom-0 left-0 flex justify-center items-center bg-slate-300 gap-2 h-10 text-lg">
      built by
      <a
        className="text-teal-600"
        href="https://twitter.com/ESArnau"
        target="_blank"
        rel="noreferrer"
      >
        Arnau Espin
      </a>
      -
      <a
        className="text-teal-600"
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
