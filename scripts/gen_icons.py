#!/usr/bin/env python3
"""Gera os icones PNG do PWA sem dependencias externas (zlib + struct)."""
import struct, zlib, math, sys, os

def png(path, w, h, pixels):
    raw = b''.join(b'\x00' + bytes(pixels[y*w*4:(y+1)*w*4]) for y in range(h))
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    hdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', hdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

def blend(dst, i, color, a):
    if a <= 0: return
    if a > 1: a = 1.0
    for k in range(3):
        dst[i+k] = int(dst[i+k] * (1 - a) + color[k] * a)
    dst[i+3] = int(dst[i+3] * (1 - a) + 255 * a)

def rounded(x, y, rx0, ry0, rx1, ry1, r):
    """distancia assinada negativa dentro do retangulo arredondado"""
    cx = min(max(x, rx0 + r), rx1 - r)
    cy = min(max(y, ry0 + r), ry1 - r)
    return math.hypot(x - cx, y - cy) - r

def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    L = vx * vx + vy * vy
    t = 0.0 if L == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L))
    return math.hypot(px - (ax + vx * t), py - (ay + vy * t))

def render(size, maskable=False):
    S = 512.0
    k = size / S
    pad = 46 if maskable else 0          # area segura para icones maskable
    scale = (S - 2 * pad) / S
    px = bytearray([0, 0, 0, 0] * size * size)
    for yy in range(size):
        for xx in range(size):
            X = (xx + 0.5) / k
            Y = (yy + 0.5) / k
            i = (yy * size + xx) * 4
            # fundo com cantos arredondados + degrade roxo->rosa
            d = rounded(X, Y, 0, 0, S, S, 112 if not maskable else 0)
            if d < 1:
                t = (X + Y) / (2 * S)
                col = (int(139 + (236 - 139) * t), int(92 + (72 - 92) * t), int(246 + (153 - 246) * t))
                blend(px, i, col, min(1.0, 1 - d))
            # coordenadas do desenho interno (encolhidas se maskable)
            U = (X - S / 2) / scale + S / 2
            V = (Y - S / 2) / scale + S / 2
            # argolas do caderno
            for ax in (150, 332):
                if rounded(U, V, ax, 88, ax + 30, 148, 15) < 0:
                    blend(px, i, (253, 230, 138), 1)
            # folha branca
            d2 = rounded(U, V, 118, 112, 394, 412, 34)
            if d2 < 1:
                blend(px, i, (255, 255, 255), min(1.0, 1 - d2))
            # tres "check" roxos
            for oy in (0, 86, 172):
                a = seg_dist(U, V, 168, 214 + oy, 194, 240 + oy)
                b = seg_dist(U, V, 194, 240 + oy, 240, 184 + oy)
                if min(a, b) < 12:
                    blend(px, i, (139, 92, 246), min(1.0, 12 - min(a, b)))
            # linhas rosa
            for oy, wdt in ((0, 86), (86, 86), (172, 60)):
                if rounded(U, V, 266, 206 + oy, 266 + wdt, 226 + oy, 10) < 0:
                    blend(px, i, (249, 168, 212), 1)
    return px

out = os.path.join(os.path.dirname(__file__), '..', 'public')
for name, size, mask in (('icon-192.png', 192, False), ('icon-512.png', 512, False), ('icon-512-maskable.png', 512, True)):
    png(os.path.join(out, name), size, size, render(size, mask))
    print('gerado', name)
