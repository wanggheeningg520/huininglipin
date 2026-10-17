import struct, zlib, os
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'miniapp', 'src', 'static', 'images')
os.makedirs(out_dir, exist_ok=True)
def make_png(width, height, rgb):
    sig = b'\x89PNG\r\n\x1a\n'
    def chunk(ctype, data):
        c = ctype + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    raw = b''
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            raw += bytes(rgb)
    idat = zlib.compress(raw)
    return sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
p = os.path.join(out_dir, 'placeholder.png')
with open(p, 'wb') as f:
    f.write(make_png(200, 200, (229, 237, 225)))
print('wrote', p)