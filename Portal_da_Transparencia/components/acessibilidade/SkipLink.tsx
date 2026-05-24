'use client';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        fixed left-4 top-0
        -translate-y-full
        focus:translate-y-4
        bg-yellow-400 text-black
        px-6 py-3 font-bold
        rounded-md
        shadow-lg
        transition-transform duration-200
        z-[9999]
        focus:outline-none
        focus:ring-4 
        focus:ring-yellow-600
        focus:ring-offset-2
      "
    >
      Pular para o conteúdo
    </a>
  );
}