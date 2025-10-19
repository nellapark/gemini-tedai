import React from 'react';

interface UploadCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  disabled?: boolean;
  isButton?: boolean;
  accept?: string;
  multiple?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  disabled = false,
  isButton = false,
  accept,
  multiple = false,
  onChange,
}) => {
  const cardStyles = `border-2 border-dashed border-primary rounded-xl p-6 hover:bg-blue-50 transition-colors h-full ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  }`;

  if (isButton) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={cardStyles}>
        <div className="w-10 h-10 mx-auto mb-2">{icon}</div>
        <p className="text-sm font-medium text-neutral-800 text-center">{title}</p>
        <p className="text-xs text-neutral-500 text-center mt-1">{subtitle}</p>
      </button>
    );
  }

  return (
    <label className="cursor-pointer">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="hidden"
        disabled={disabled}
      />
      <div className={cardStyles}>
        <div className="w-10 h-10 mx-auto mb-2">{icon}</div>
        <p className="text-sm font-medium text-neutral-800 text-center">{title}</p>
        <p className="text-xs text-neutral-500 text-center mt-1">{subtitle}</p>
      </div>
    </label>
  );
};

