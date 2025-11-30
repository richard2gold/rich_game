import React from 'react';

interface ActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  image?: string; // Optional image/icon
  options: { label: string; action: () => void; primary?: boolean; disabled?: boolean }[];
  onClose?: () => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({ isOpen, title, description, options, image }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-800 border-4 border-yellow-500 rounded-2xl max-w-md w-full p-6 shadow-2xl transform scale-100 transition-transform">
        <div className="text-center mb-6">
          {image && <div className="text-6xl mb-4 animate-float">{image}</div>}
          <h2 className="text-2xl font-black text-yellow-400 mb-2 uppercase tracking-wide">{title}</h2>
          <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">{description}</p>
        </div>
        
        <div className="flex flex-col gap-3">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={opt.action}
              disabled={opt.disabled}
              className={`
                w-full py-3 rounded-lg font-bold text-lg transition-all
                ${opt.primary 
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_4px_0_rgb(161,98,7)] hover:shadow-[0_2px_0_rgb(161,98,7)] translate-y-0 hover:translate-y-[2px]' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white shadow-[0_4px_0_rgb(55,65,81)] hover:shadow-[0_2px_0_rgb(55,65,81)]'}
                ${opt.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
