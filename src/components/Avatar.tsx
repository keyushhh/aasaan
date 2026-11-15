import { cx } from './cx';

/** The citizen's photo, or the first letter of their name when there is none. */
export function Avatar({ name, photo, className }: { name: string; photo?: string; className?: string }) {
  return (
    <span className={cx('logo', className)} aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : name.trim()[0]}
    </span>
  );
}

/** Square-crops and shrinks a picked image to a small JPEG, so it fits comfortably in the session on the phone. */
export function toAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('not an image'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) return (URL.revokeObjectURL(url), reject(new Error('no size')));
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d')!;
      // JPEG has no transparency: paint the plate first so a see-through image doesn't turn black.
      g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--logo-plate').trim() || 'white';
      g.fillRect(0, 0, size, size);
      g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => (URL.revokeObjectURL(url), reject(new Error('unreadable image')));
    img.src = url;
  });
}
