import type { ButtonHTMLAttributes } from 'react';

type FileExistCheckButtonProps = {
  isChecking: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;

export default function FileExistCheckButton({
  isChecking,
  disabled,
  children,
  ...rest
}: FileExistCheckButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      disabled={isChecking || disabled}
      className={`file-exist-btn${isChecking ? ' checking' : ''}`}
    >
      {isChecking ? 'Sprawdzam pliki…' : children ?? 'Sprawdź pliki TXT'}
    </button>
  );
}
