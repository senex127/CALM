const fs = require('fs');

// Le mimetype que multer voit (fileFilter) vient d'un header envoyé par le client — un
// fichier malveillant renommé en .png avec un faux Content-Type le franchirait. On vérifie
// donc la signature binaire réelle une fois le fichier écrit, avant de le rendre accessible.
const SIGNATURES = [
  { bytes: [0xff, 0xd8, 0xff], name: 'jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], name: 'png' },
  { bytes: [0x52, 0x49, 0x46, 0x46], name: 'webp', offset: 0, extra: { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 } },
];

function matchesSignature(buffer) {
  return SIGNATURES.some(({ bytes, offset = 0, extra }) => {
    const head = bytes.every((b, i) => buffer[offset + i] === b);
    if (!head) return false;
    if (!extra) return true;
    return extra.bytes.every((b, i) => buffer[extra.offset + i] === b);
  });
}

// Renvoie une URL absolue (pas relative) : en local, frontend (5174) et backend (3002) sont
// deux origines différentes, une URL relative pointerait sur le mauvais port. En prod les
// deux sont servis par le même processus, donc ça reste correct aussi.
exports.upload = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

  const handle = fs.openSync(req.file.path, 'r');
  const header = Buffer.alloc(12);
  fs.readSync(handle, header, 0, 12, 0);
  fs.closeSync(handle);

  if (!matchesSignature(header)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Le fichier ne correspond pas à une image jpeg, png ou webp valide' });
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
};
