# media-inbox (content factory → Cloudflare R2)

Encrypted inbox for raw footage. Files here are AES-256 encrypted with a per-file key that is wrapped
with `keys/public.pem` (RSA-OAEP). Only the GitHub runner can unwrap it, using the private key stored in
the private R2 bucket `bangtaostyle-media`. Plaintext never enters git. `keys/LAST_INDEX.txt` lists what
the bucket holds (paths, sizes, resolution, duration).
